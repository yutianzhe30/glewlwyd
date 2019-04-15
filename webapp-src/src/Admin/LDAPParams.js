import React, { Component } from 'react';

class LDAPParams extends Component {
  constructor(props) {
    super(props);
    
    if (!props.mod.parameters["scope-match"]) {
      props.mod.parameters["scope-match"] = [];
    }
    
    this.state = {
      mod: props.mod,
      role: props.role
    };
    
    this.addDataFormat = this.addDataFormat.bind(this);
    this.changeDataFormatProperty = this.changeDataFormatProperty.bind(this);
    this.changeDataFormatLdapProperty = this.changeDataFormatLdapProperty.bind(this);
    this.toggleDataFormatValue = this.toggleDataFormatValue.bind(this);
    this.deleteDataFormat = this.deleteDataFormat.bind(this);
    this.changeParam = this.changeParam.bind(this);
    this.addScopeMatch = this.addScopeMatch.bind(this);
    this.changeScopeMatchProperty = this.changeScopeMatchProperty.bind(this);
    this.changeMatchType = this.changeMatchType.bind(this);
    this.changePasswordAlgorithm = this.changePasswordAlgorithm.bind(this);
    this.getMatchType = this.getMatchType.bind(this);
    this.changePageSize = this.changePageSize.bind(this);
  }
  
  componentWillReceiveProps(nextProps) {
    
    if (!nextProps.mod.parameters["scope-match"]) {
      nextProps.mod.parameters["scope-match"] = [];
    }
    
    this.setState({
      mod: nextProps.mod,
      role: nextProps.role
    });
  }
  
  addDataFormat() {
    var mod = this.state.mod;
    if (!mod.parameters["data-format"]) {
      mod.parameters["data-format"] = {};
    }
    mod.parameters["data-format"][""] = {property: "", multiple: false, read: true, write: true, "profile-read": false, "profile-write": false};
    this.setState({mod: mod});
  }
  
  changeDataFormatProperty(e, property) {
    var mod = this.state.mod;
    mod.parameters["data-format"][e.target.value] = mod.parameters["data-format"][property];
    delete(mod.parameters["data-format"][property]);
    this.setState({mod: mod});
  }
  
  changeDataFormatLdapProperty(e, property) {
    var mod = this.state.mod;
    mod.parameters["data-format"][property].property = e.target.value;
    this.setState({mod: mod});
  }
  
  toggleDataFormatValue(e, property, value) {
    var mod = this.state.mod;
    mod.parameters["data-format"][property][value] = !mod.parameters["data-format"][property][value];
    this.setState({mod: mod});
  }
  
  deleteDataFormat(e, property) {
    var mod = this.state.mod;
    delete(mod.parameters["data-format"][property]);
    this.setState({mod: mod});
  }
  
  changeParam(e, parameter, toArray = false) {
    var mod = this.state.mod;
    if (toArray) {
      mod.parameters[parameter] = e.target.value.replace(/ /g, '').split(',');
    } else {
      mod.parameters[parameter] = e.target.value;
    }
    this.setState({mod: mod});
  }
  
  addScopeMatch() {
    var mod = this.state.mod;
    if (!mod.parameters["scope-match"]) {
      mod.parameters["scope-match"] = [];
    }
    mod.parameters["scope-match"].push({"ldap-value": "", "scope-value": "", "match": "equals"});
    this.setState({mod: mod});
  }
  
  changeScopeMatchProperty(e, index, property) {
    var mod = this.state.mod;
    mod.parameters["scope-match"][index][property] = e.target.value;
    this.setState({mod: mod});
  }
  
  changeMatchType(e, index, type) {
    var mod = this.state.mod;
    mod.parameters["scope-match"][index].match = type;
    this.setState({mod: mod});
  }
  
  changePasswordAlgorithm(e, alg) {
    var mod = this.state.mod;
    mod.parameters["password-algorithm"] = alg;
    this.setState({mod: mod});
  }
  
  getMatchType(type) {
    if (type === "contains") {
      return i18next.t("admin.mod-ldap-scope-match-contains");
    } else if (type === "startswith") {
      return i18next.t("admin.mod-ldap-scope-match-startswith");
    } else if (type === "endswith") {
      return i18next.t("admin.mod-ldap-scope-match-endswith");
    } else {
      return i18next.t("admin.mod-ldap-scope-match-equals");
    }
  }
  
  changePageSize(e) {
    var mod = this.state.mod;
    mod.parameters["page-size"] = parseInt(e.target.value);
    this.setState({mod: mod});
  }
  
  render() {
    var dataFormat = [], scopeMatch = [];
    var i = 0;
    for (var property in this.state.mod.parameters["data-format"]) {
      dataFormat.push(<div key={i++}>
        <hr/>
        <div className="form-group">
          <label htmlFor={"mod-database-data-format-name-"+property}>{i18next.t("admin.mod-database-data-format-property")}</label>
          <input type="text" className="form-control" id={"mod-database-data-format-name-"+property} onChange={(e) => this.changeDataFormatProperty(e, property)} value={property} placeholder={i18next.t("admin.mod-database-data-format-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor={"mod-database-data-format-name-"+property}>{i18next.t("admin.mod-database-data-format-ldap-property")}</label>
          <input type="text" className="form-control" id={"mod-database-data-format-ldap-name-"+property} onChange={(e) => this.changeDataFormatLdapProperty(e, property)} value={this.state.mod.parameters["data-format"][property].property} placeholder={i18next.t("admin.mod-database-data-format-ldap-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor={"mod-database-data-format-read-"+property}>{i18next.t("admin.mod-database-data-format-read")}</label>
          <input type="checkbox" className="form-control" id={"mod-database-data-format-read-"+property} onChange={(e) => this.toggleDataFormatValue(e, property, "read")} checked={this.state.mod.parameters["data-format"][property]["read"]} />
        </div>
        <div className="form-group">
          <label htmlFor={"mod-database-data-format-write-"+property}>{i18next.t("admin.mod-database-data-format-write")}</label>
          <input type="checkbox" className="form-control" id={"mod-database-data-format-write-"+property} onChange={(e) => this.toggleDataFormatValue(e, property, "write")} checked={this.state.mod.parameters["data-format"][property]["write"]} />
        </div>
        <div className="form-group">
          <label htmlFor={"mod-database-data-format-read-"+property}>{i18next.t("admin.mod-database-data-format-profile-read")}</label>
          <input type="checkbox" className="form-control" id={"mod-database-data-format-profile-read-"+property} onChange={(e) => this.toggleDataFormatValue(e, property, "profile-read")} checked={this.state.mod.parameters["data-format"][property]["profile-read"]} />
        </div>
        <div className="form-group">
          <label htmlFor={"mod-database-data-format-profile-write-"+property}>{i18next.t("admin.mod-database-data-format-profile-write")}</label>
          <input type="checkbox" className="form-control" id={"mod-database-data-format-profile-write-"+property} onChange={(e) => this.toggleDataFormatValue(e, property, "profile-write")} checked={this.state.mod.parameters["data-format"][property]["profile-write"]} />
        </div>
        <button type="button" className="btn btn-secondary" onClick={(e) => this.deleteDataFormat(e, property)} title={i18next.t("admin.mod-data-format-delete")}>
          <i className="fas fa-trash"></i>
        </button>
      </div>);
    }
    this.state.mod.parameters["scope-match"].forEach((match, index) => {
      scopeMatch.push(<div key={index}>
        <div className="form-group">
          <label htmlFor={"mod-ldap-scope-match-ldap-"+index}>{i18next.t("admin.mod-ldap-scope-match-ldap")}</label>
          <input type="text" className="form-control" id={"mod-ldap-scope-match-ldap-"+index} onChange={(e) => this.changeScopeMatchProperty(e, index, "ldap-value")} value={match["ldap-value"]} placeholder={i18next.t("admin.mod-ldap-scope-match-ldap-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor={"mod-ldap-scope-match-scope-"+index}>{i18next.t("admin.mod-ldap-scope-match-scope")}</label>
          <input type="text" className="form-control" id={"mod-ldap-scope-match-scope-"+index} onChange={(e) => this.changeScopeMatchProperty(e, index, "scope-value")} value={match["scope-value"]} placeholder={i18next.t("admin.mod-ldap-scope-match-scope-ph")} />
        </div>
        <div className="dropdown">
          <button className="btn btn-secondary dropdown-toggle" type="button" id={"dropdownMatchType-"+index} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {this.getMatchType(match["match"])}
          </button>
          <div className="dropdown-menu" aria-labelledby={"dropdownMatchType-"+index}>
            <a className="dropdown-item" href="#" onClick={(e) => this.changeMatchType(e, index, 'equals')}>{i18next.t("admin.mod-ldap-scope-match-equals")}</a>
            <a className="dropdown-item" href="#" onClick={(e) => this.changeMatchType(e, index, 'contains')}>{i18next.t("admin.mod-ldap-scope-match-contains")}</a>
            <a className="dropdown-item" href="#" onClick={(e) => this.changeMatchType(e, index, 'startswith')}>{i18next.t("admin.mod-ldap-scope-match-startswith")}</a>
            <a className="dropdown-item" href="#" onClick={(e) => this.changeMatchType(e, index, 'endswith')}>{i18next.t("admin.mod-ldap-scope-match-endswith")}</a>
          </div>
        </div>
      </div>
      );
    });
    return (
      <div>
        <div className="form-group">
          <label htmlFor="mod-ldap-uri">{i18next.t("admin.mod-ldap-uri")}</label>
          <input type="text" className="form-control" id="mod-ldap-uri" onChange={(e) => this.changeParam(e, "uri")} value={this.state.mod.parameters["uri"]} placeholder={i18next.t("admin.mod-ldap-uri-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-bind-dn">{i18next.t("admin.mod-ldap-bind-dn")}</label>
          <input type="text" className="form-control" id="mod-ldap-bind-dn" onChange={(e) => this.changeParam(e, "bind-dn")} value={this.state.mod.parameters["bind-dn"]} placeholder={i18next.t("admin.mod-ldap-bind-dn-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-bind-password">{i18next.t("admin.mod-ldap-bind-password")}</label>
          <input type="password" className="form-control" id="mod-ldap-bind-password" onChange={(e) => this.changeParam(e, "bind-password")} value={this.state.mod.parameters["bind-password"]} placeholder={i18next.t("admin.mod-ldap-bind-password-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-page-size">{i18next.t("admin.mod-ldap-page-size")}</label>
          <input type="number" min="0" step="1" className="form-control" id="mod-ldap-page-size" onChange={this.changePageSize} value={this.state.mod.parameters["page-size"]} placeholder={i18next.t("admin.mod-ldap-page-size-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-base-search">{i18next.t("admin.mod-ldap-base-search")}</label>
          <input type="text" className="form-control" id="mod-ldap-base-search" onChange={(e) => this.changeParam(e, "base-search")} value={this.state.mod.parameters["base-search"]} placeholder={i18next.t("admin.mod-ldap-base-search-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-filter">{i18next.t("admin.mod-ldap-filter")}</label>
          <input type="text" className="form-control" id="mod-ldap-filter" onChange={(e) => this.changeParam(e, "filter")} value={this.state.mod.parameters["filter"]} placeholder={i18next.t("admin.mod-ldap-filter-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-username-property">{i18next.t("admin.mod-ldap-username-property")}</label>
          <input type="text" className="form-control" id="mod-ldap-username-property" onChange={(e) => this.changeParam(e, "username-property", true)} value={this.state.mod.parameters["username-property"]} placeholder={i18next.t("admin.mod-ldap-username-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-scope-property">{i18next.t("admin.mod-ldap-scope-property")}</label>
          <input type="text" className="form-control" id="mod-ldap-scope-property" onChange={(e) => this.changeParam(e, "scope-property", true)} value={this.state.mod.parameters["scope-property"]} placeholder={i18next.t("admin.mod-ldap-scope-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-name-property">{i18next.t("admin.mod-ldap-name-property")}</label>
          <input type="text" className="form-control" id="mod-ldap-name-property" onChange={(e) => this.changeParam(e, "name-property", true)} value={this.state.mod.parameters["name-property"]} placeholder={i18next.t("admin.mod-ldap-name-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-email-property">{i18next.t("admin.mod-ldap-email-property")}</label>
          <input type="text" className="form-control" id="mod-ldap-email-property" onChange={(e) => this.changeParam(e, "email-property", true)} value={this.state.mod.parameters["email-property"]} placeholder={i18next.t("admin.mod-ldap-email-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-rdn-property">{i18next.t("admin.mod-ldap-rdn-property")}</label>
          <input type="text" className="form-control" id="mod-ldap-rdn-property" onChange={(e) => this.changeParam(e, "rdn-property")} value={this.state.mod.parameters["rdn-property"]} placeholder={i18next.t("admin.mod-ldap-rdn-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-password-property">{i18next.t("admin.mod-ldap-password-property")}</label>
          <input type="text" className="form-control" id="mod-ldap-password-property" onChange={(e) => this.changeParam(e, "password-property")} value={this.state.mod.parameters["password-property"]} placeholder={i18next.t("admin.mod-ldap-password-property-ph")} />
        </div>
        <div className="form-group">
          <label htmlFor="dropdownPasswordAlgorithm">{i18next.t("admin.mod-ldap-password-algorithm")}</label>
          <div className="dropdown">
            <button className="btn btn-secondary dropdown-toggle" type="button" id={"dropdownPasswordAlgorithm"} data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              {this.state.mod.parameters["password-algorithm"] || i18next.t("admin.mod-ldap-password-algorithm-select")}
            </button>
            <div className="dropdown-menu" aria-labelledby={"dropdownPasswordAlgorithm"}>
              <a className="dropdown-item" href="#" onClick={(e) => this.changePasswordAlgorithm(e, 'SSHA')}>{i18next.t("admin.mod-ldap-password-algorithm-ssha")}</a>
              <a className="dropdown-item" href="#" onClick={(e) => this.changePasswordAlgorithm(e, 'SHA')}>{i18next.t("admin.mod-ldap-password-algorithm-sha")}</a>
              <a className="dropdown-item" href="#" onClick={(e) => this.changePasswordAlgorithm(e, 'SMD5')}>{i18next.t("admin.mod-ldap-password-algorithm-smd5")}</a>
              <a className="dropdown-item" href="#" onClick={(e) => this.changePasswordAlgorithm(e, 'MD5')}>{i18next.t("admin.mod-ldap-password-algorithm-md5")}</a>
              <a className="dropdown-item" href="#" onClick={(e) => this.changePasswordAlgorithm(e, 'PLAIN')}>{i18next.t("admin.mod-ldap-password-algorithm-plain")}</a>
            </div>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="mod-ldap-object-class">{i18next.t("admin.mod-ldap-object-class")}</label>
          <input type="text" className="form-control" id="mod-ldap-object-class" onChange={(e) => this.changeParam(e, "object-class", true)} value={this.state.mod.parameters["object-class"]} placeholder={i18next.t("admin.mod-ldap-object-class-ph")} />
        </div>
        <div className="accordion" id="accordionParams">
          <div className="card">
            <div className="card-header" id="dataFormatCard">
              <h2 className="mb-0">
                <button className="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseDataFormat" aria-expanded="true" aria-controls="collapseDataFormat">
                  {i18next.t("admin.mod-data-format")}
                </button>
              </h2>
            </div>
            <div id="collapseDataFormat" className="collapse" aria-labelledby="dataFormatCard" data-parent="#accordionParams">
              <div className="card-body">
                <p>{i18next.t("admin.mod-data-format-message")}</p>
                <button type="button" className="btn btn-secondary" onClick={this.addDataFormat} title={i18next.t("admin.mod-data-format-add")}>
                  <i className="fas fa-plus"></i>
                </button>
                {dataFormat}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header" id="scopeMatchCard">
              <h2 className="mb-0">
                <button className="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseScopeMatch" aria-expanded="true" aria-controls="collapseScopeMatch">
                  {i18next.t("admin.mod-scope-match")}
                </button>
              </h2>
            </div>
            <div id="collapseScopeMatch" className="collapse" aria-labelledby="scopeMatchCard" data-parent="#accordionParams">
              <div className="card-body">
                <button type="button" className="btn btn-secondary" onClick={this.addScopeMatch} title={i18next.t("admin.mod-scope-match-add")}>
                  <i className="fas fa-plus"></i>
                </button>
                {scopeMatch}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LDAPParams;
