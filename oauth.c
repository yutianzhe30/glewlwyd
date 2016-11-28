/**
 *
 * Glewlwyd OAuth2 Authorization Server
 *
 * OAuth2 authentiation server
 * Users are authenticated with a LDAP server
 * or users stored in the database 
 * 
 * main functions definitions
 *
 * Copyright 2016 Nicolas Mora <mail@babelouest.org>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation;
 * version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

#include <string.h>

#include "glewlwyd.h"

int check_auth_type_auth_code_grant (const struct _u_request * request, struct _u_response * response, void * user_data) {
  // The most used authorization type: client redirects user to login page, 
  // Then if authorized, glewlwyd redirects to redirect_uri with a code in the uri
  // If necessary, two intermediate steps can be used: login page and grant access page
  struct config_elements * config = (struct config_elements *)user_data;
  char * authorization_code = NULL, * redirect_url, * cb_encoded, * query;
  const char * ip_source = get_ip_source(request);
  json_t * session_payload, * j_scope, * j_client_check;
  time_t now;
  
  // Check if client is allowed to perform this request
  j_client_check = client_check(config, u_map_get(request->map_url, "client_id"), request->auth_basic_user, request->auth_basic_password, u_map_get(request->map_url, "redirect_uri"), GLEWLWYD_AUHORIZATION_TYPE_AUTHORIZATION_CODE);
  if (check_result_value(j_client_check, G_OK)) {
    // Client is allowed to use implicit grant with this redirection_uri
    session_payload = session_check(config, request);
    if (check_result_value(session_payload, G_OK)) {
      // User Session is valid
      time(&now);
      if (config->use_scope) {
        j_scope = auth_check_scope(config, json_string_value(json_object_get(session_payload, "username")), u_map_get(request->map_url, "scope"));
        if (check_result_value(j_scope, G_OK)) {
          // User is allowed for this scope
          if (auth_check_client_user_scope(config, u_map_get(request->map_url, "client_id"), json_string_value(json_object_get(session_payload, "username")), json_string_value(json_object_get(j_scope, "scope"))) == G_OK) {
            // User has granted access to the cleaned scope list for this client
            // Generate code, generate the url and redirect to it
            authorization_code = generate_authorization_code(config, json_string_value(json_object_get(session_payload, "username")), u_map_get(request->map_url, "client_id"), json_string_value(json_object_get(j_scope, "scope")), u_map_get(request->map_url, "redirect_uri"), ip_source);
            redirect_url = msprintf("%s#code=%s%s%s", u_map_get(request->map_url, "redirect_uri"), authorization_code, (u_map_get(request->map_url, "state")!=NULL?"&state=":""), (u_map_get(request->map_url, "state")!=NULL?u_map_get(request->map_url, "state"):""));
            ulfius_add_header_to_response(response, "Location", redirect_url);
            free(redirect_url);
            free(authorization_code);
            response->status = 302;
          } else {
            // User has not granted access to the cleaned scope list for this client, redirect to grant access page
            cb_encoded = url_encode(request->http_url);
            query = generate_query_parameters(request);
            redirect_url = msprintf("../../%s/grant.html?%s", config->static_files_prefix, query);
            ulfius_add_header_to_response(response, "Location", redirect_url);
            free(redirect_url);
            free(cb_encoded);
            free(query);
            response->status = 302;
          }
        } else {
          // Scope is not allowed for this user
          response->status = 302;
          redirect_url = msprintf("%s#error=invalid_scope%s%s", u_map_get(request->map_url, "redirect_uri"), (u_map_get(request->map_url, "state")!=NULL?"&state=":""), (u_map_get(request->map_url, "state")!=NULL?u_map_get(request->map_url, "state"):""));
          ulfius_add_header_to_response(response, "Location", redirect_url);
          free(redirect_url);
        }
        json_decref(j_scope);
      } else {
        // Generate code, generate the url and redirect to it
        authorization_code = generate_authorization_code(config, json_string_value(json_object_get(session_payload, "username")), u_map_get(request->map_url, "client_id"), NULL, u_map_get(request->map_url, "redirect_uri"), ip_source);
        redirect_url = msprintf("%s#code=%s%s%s", u_map_get(request->map_url, "redirect_uri"), authorization_code, (u_map_get(request->map_url, "state")!=NULL?"&state=":""), (u_map_get(request->map_url, "state")!=NULL?u_map_get(request->map_url, "state"):""));
        ulfius_add_header_to_response(response, "Location", redirect_url);
        free(redirect_url);
        free(authorization_code);
        response->status = 302;
      }
    } else {
      // Redirect to login page
      cb_encoded = url_encode(request->http_url);
      query = generate_query_parameters(request);
      redirect_url = msprintf("../../%s/login.html?%s", config->static_files_prefix, query);
      ulfius_add_header_to_response(response, "Location", redirect_url);
      free(redirect_url);
      free(cb_encoded);
      free(query);
      response->status = 302;
    }
    json_decref(session_payload);
  } else {
    // client is not authorized with this redirect_uri
    response->status = 302;
    redirect_url = msprintf("%s#error=unauthorized_client%s%s", u_map_get(request->map_url, "redirect_uri"), (u_map_get(request->map_url, "state")!=NULL?"&state=":""), (u_map_get(request->map_url, "state")!=NULL?u_map_get(request->map_url, "state"):""));
    ulfius_add_header_to_response(response, "Location", redirect_url);
    free(redirect_url);
  }
  json_decref(j_client_check);
  
  return U_OK;
}

int check_auth_type_access_token_request (const struct _u_request * request, struct _u_response * response, void * user_data) {
  struct config_elements * config = (struct config_elements *)user_data;
  json_t * j_query, * j_validate;
  int res;
  const char * code = u_map_get(request->map_post_body, "code"), 
             * client_id = u_map_get(request->map_post_body, "client_id"), 
             * redirect_uri = u_map_get(request->map_post_body, "redirect_uri"),
             * ip_source = get_ip_source(request),
             * scope_list;
  time_t now;
  char * refresh_token, * access_token;
  
  j_validate = validate_authorization_code(config, code, client_id, redirect_uri, ip_source);
  if (check_result_value(j_validate, G_OK)) {
    if (config->use_scope) {
      scope_list = json_string_value(json_object_get(j_validate, "scope"));
    }
    time(&now);
    refresh_token = generate_refresh_token(config, json_string_value(json_object_get(j_validate, "username")), GLEWLWYD_AUHORIZATION_TYPE_CODE, ip_source, scope_list, now);
    if (refresh_token != NULL) {
      access_token = generate_access_token(config, refresh_token, json_string_value(json_object_get(j_validate, "username")), GLEWLWYD_AUHORIZATION_TYPE_CODE, ip_source, scope_list, now);
      if (access_token != NULL) {
        // Disable gco_id entry
        j_query = json_pack("{sss{si}s{sI}}",
                            "table",
                            GLEWLWYD_TABLE_CODE,
                            "set",
                              "gco_enabled",
                              0,
                            "where",
                              "gco_id",
                              json_integer_value((json_object_get(j_validate, "gco_id"))));
        res = h_update(config->conn, j_query, NULL);
        json_decref(j_query);
        if (res == H_OK) {
          // Finally, the tokens are all here, no error, no problem
          response->json_body = json_pack("{sssssssi}",
                                "token_type",
                                "bearer",
                                "access_token",
                                access_token,
                                "refresh_token",
                                refresh_token,
                                "iat",
                                now);
        } else {
          y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_access_token_request - error executing j_query update");
          response->status = 500;
        }
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_access_token_request - error generating access_token");
        response->status = 500;
      }
      free(access_token);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_access_token_request - error generating refresh_token");
      response->status = 500;
    }
    free(refresh_token);
  }
  json_decref(j_validate);
  
  return U_OK;
}

int check_auth_type_implicit_grant (const struct _u_request * request, struct _u_response * response, void * user_data) {
  // The second more simple authorization type: client redirects user to login page, 
  // Then if authorized, glewlwyd redirects to redirect_uri with the access_token in the uri
  // If necessary, two intermediate steps can be used: login page and grant access page
  struct config_elements * config = (struct config_elements *)user_data;
  char * access_token = NULL, * redirect_url, * cb_encoded, * query;
  const char * ip_source = get_ip_source(request);
  json_t * session_payload, * j_scope, * j_client_check;
  time_t now;
  
  // Check if client_id and redirect_uri are valid
  j_client_check = client_check(config, u_map_get(request->map_url, "client_id"), request->auth_basic_user, request->auth_basic_password, u_map_get(request->map_url, "redirect_uri"), GLEWLWYD_AUHORIZATION_TYPE_IMPLICIT);
  if (check_result_value(j_client_check, G_OK)) {
    // Client is allowed to use implicit grant with this redirection_uri
    session_payload = session_check(config, request);
    if (check_result_value(session_payload, G_OK)) {
      // User Session is valid
      time(&now);
      if (config->use_scope) {
        j_scope = auth_check_scope(config, json_string_value(json_object_get(session_payload, "username")), u_map_get(request->map_url, "scope"));
        if (check_result_value(j_scope, G_OK)) {
          // User is allowed for this scope
          if (auth_check_client_user_scope(config, u_map_get(request->map_url, "client_id"), json_string_value(json_object_get(session_payload, "username")), json_string_value(json_object_get(j_scope, "scope"))) == G_OK) {
            // User has granted access to the cleaned scope list for this client
            access_token = generate_access_token(config, NULL, json_string_value(json_object_get(session_payload, "username")), GLEWLWYD_AUHORIZATION_TYPE_RESOURCE_OWNER_PASSWORD_CREDENTIALS, ip_source, NULL, now);
            if (u_map_get(request->map_url, "state") != NULL) {
              redirect_url = msprintf("%s#access_token=%s&token_type=bearer&expires_in=%d&state=%s", u_map_get(request->map_url, "redirect_uri"), access_token, config->access_token_expiration, u_map_get(request->map_url, "state"));
            } else {
              redirect_url = msprintf("%s#access_token=%s&token_type=bearer&expires_in=%d", u_map_get(request->map_url, "redirect_uri"), access_token, config->access_token_expiration);
            }
            ulfius_add_header_to_response(response, "Location", redirect_url);
            free(redirect_url);
            free(access_token);
            response->status = 302;
          } else {
            // User has not granted access to the cleaned scope list for this client, redirect to grant access page
            cb_encoded = url_encode(request->http_url);
            query = generate_query_parameters(request);
            redirect_url = msprintf("../../%s/grant.html?%s", config->static_files_prefix, query);
            ulfius_add_header_to_response(response, "Location", redirect_url);
            free(redirect_url);
            free(cb_encoded);
            free(query);
            response->status = 302;
          }
        } else {
          // Scope is not allowed for this user
          response->status = 302;
          redirect_url = msprintf("%s#error=invalid_scope%s%s", u_map_get(request->map_url, "redirect_uri"), (u_map_get(request->map_url, "state")!=NULL?"&state=":""), (u_map_get(request->map_url, "state")!=NULL?u_map_get(request->map_url, "state"):""));
          ulfius_add_header_to_response(response, "Location", redirect_url);
          free(redirect_url);
        }
        json_decref(j_scope);
      } else {
        // Generate access_token, generate the url and redirect to it
        access_token = generate_access_token(config, NULL, json_string_value(json_object_get(session_payload, "username")), GLEWLWYD_AUHORIZATION_TYPE_RESOURCE_OWNER_PASSWORD_CREDENTIALS, ip_source, NULL, now);
        if (u_map_get(request->map_url, "state") != NULL) {
          redirect_url = msprintf("%s#access_token=%s&token_type=bearer&expires_in=%d&state=%s", access_token, u_map_get(request->map_url, "redirect_uri"), config->access_token_expiration, u_map_get(request->map_url, "state"));
        } else {
          redirect_url = msprintf("%s#access_token=%s&token_type=bearer&expires_in=%d", access_token, u_map_get(request->map_url, "redirect_uri"), config->access_token_expiration);
        }
        ulfius_add_header_to_response(response, "Location", redirect_url);
        free(redirect_url);
        response->status = 302;
      }
    } else {
      // Redirect to login page
      cb_encoded = url_encode(request->http_url);
      query = generate_query_parameters(request);
      redirect_url = msprintf("../../%s/login.html?%s", config->static_files_prefix, query);
      ulfius_add_header_to_response(response, "Location", redirect_url);
      free(redirect_url);
      free(cb_encoded);
      free(query);
      response->status = 302;
    }
    json_decref(session_payload);
  } else {
    // client is not authorized with this redirect_uri
    response->status = 302;
    redirect_url = msprintf("%s#error=unauthorized_client%s%s", u_map_get(request->map_url, "redirect_uri"), (u_map_get(request->map_url, "state")!=NULL?"&state=":""), (u_map_get(request->map_url, "state")!=NULL?u_map_get(request->map_url, "state"):""));
    ulfius_add_header_to_response(response, "Location", redirect_url);
    free(redirect_url);
  }
  json_decref(j_client_check);
  return U_OK;
}

int check_auth_type_resource_owner_pwd_cred (const struct _u_request * request, struct _u_response * response, void * user_data) {
  // The more simple authorization type: username and password are given in the POST parameters, the access_token and refresh_token in a json object are returned
  struct config_elements * config = (struct config_elements *)user_data;
  time_t now;
  char * refresh_token, * access_token;
  const char * ip_source = get_ip_source(request);
  json_t * j_result = auth_check(config, u_map_get(request->map_post_body, "username"), u_map_get(request->map_post_body, "password"), u_map_get(request->map_post_body, "scope"));
  
  if (check_result_value(j_result, G_OK)) {
    time(&now);
    refresh_token = generate_refresh_token(config, u_map_get(request->map_post_body, "username"), GLEWLWYD_AUHORIZATION_TYPE_RESOURCE_OWNER_PASSWORD_CREDENTIALS, ip_source, u_map_get(request->map_post_body, "scope"), now);
    if (refresh_token != NULL) {
      access_token = generate_access_token(config, refresh_token, u_map_get(request->map_post_body, "username"), GLEWLWYD_AUHORIZATION_TYPE_RESOURCE_OWNER_PASSWORD_CREDENTIALS, ip_source, u_map_get(request->map_post_body, "scope"), now);
      if (access_token != NULL) {
          response->json_body = json_pack("{sssssssi}",
                                "token_type",
                                "bearer",
                                "access_token",
                                access_token,
                                "refresh_token",
                                refresh_token,
                                "iat",
                                now);
        if (response->json_body != NULL) {
          if (config->use_scope) {
            json_object_set_new(response->json_body, "scope", json_string(u_map_get(request->map_post_body, "scope")));
          }
        } else {
          y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_resource_owner_pwd_cred - error allocating resources for response->json_body");
          response->status = 500;
        }
      } else {
        y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_resource_owner_pwd_cred - error allocating resources for access_token");
        response->status = 500;
      }
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_resource_owner_pwd_cred - error allocating resources for refresh_token");
      response->status = 500;
    }
  } else if (check_result_value(j_result, G_ERROR_UNAUTHORIZED)) {
    response->status = 403;
  } else {
    y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_resource_owner_pwd_cred - error checking credentials");
    response->status = 500;
  }
  json_decref(j_result);
  return U_OK;
}

int check_auth_type_client_credentials_grant (const struct _u_request * request, struct _u_response * response, void * user_data) {
  // This is just to send an access_token to a client
  json_t * j_client_check;
  struct config_elements * config = (struct config_elements *)user_data;
  char * access_token;
  const char * ip_source = get_ip_source(request);
  time_t now;
  
  j_client_check = client_check(config, u_map_get(request->map_url, "client_id"), request->auth_basic_user, request->auth_basic_password, u_map_get(request->map_url, "redirect_uri"), GLEWLWYD_AUHORIZATION_TYPE_AUTHORIZATION_CODE);
  if (request->auth_basic_user != NULL && request->auth_basic_password != NULL && check_result_value(j_client_check, G_OK)) {
    time(&now);
    access_token = generate_client_access_token(config, json_string_value(json_object_get(j_client_check, "client_id")), ip_source, now);
    if (access_token != NULL) {
      response->json_body = json_pack("{sssssi}",
                                      "access_token", access_token,
                                      "token_type", "bearer",
                                      "expires_in", config->access_token_expiration);
      free(access_token);
    } else {
      y_log_message(Y_LOG_LEVEL_ERROR, "check_auth_type_client_credentials_grant - Error generating access_token");
      response->status = 500;
    }
  } else {
    response->status = 403;
  }
  json_decref(j_client_check);
  return U_OK;
}
