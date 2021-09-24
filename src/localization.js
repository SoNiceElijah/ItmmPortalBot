
const yaml = require('yaml');

const path = require('path');
const fs = require('fs');

const CMNDS = yaml.parse(fs.readFileSync(path.resolve(__dirname,'..','local','commands.yaml')));
const LOCAL_RU = yaml.parse(fs.readFileSync(path.resolve(__dirname,'..','local','ru_RU.yaml')));
const SHARED = yaml.parse(fs.readFileSync(path.resolve(__dirname,'..','local','shared.yaml')));

function get(lng)
{
    return LOCAL_RU;
}

function $local()
{
    let { lng } = this.user;
    return get(lng);
}

function render(db,name,model)
{
    let s = db[name];
    s = resolvefuncs(db,name,model);
    s = resolvevars(s,model);
    return s;
}

function resolvevars(template,model)
{
    let names = template.match(/$\w+$/g);
    let s = template.substring();
    for(let name of names) s = s.replace(name,model[name]);
    return s;
}

function resolvefuncs(db,name,model)
{
    let template = db[name];
    let funcs = template.match(/#\w+#/);

    for(let f of funcs)
    {
        f = f.split('.');
        let collection = f[0];
        let xname = f[1];

        let strs = '';
        for(let item of model[collection]) strs += render(db[xname],item);

        template = template.replace(f,strs);
    }

    return template;
}

function prepoc(model)
{
    //TODO: collect data and finish method
}

function $text(model)
{
    if(Array.isArray(model)) model = { base : model };
    this.atext = render(this.$local(),this.template,model);   
}

function $cmnds()
{
    return CMNDS;
}

module.exports = {
    CMNDS,
    SHARED,
    $text,
    $local,
    $cmnds
    
}
