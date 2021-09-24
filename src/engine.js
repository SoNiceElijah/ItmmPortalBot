
const User = require('../db/user');
const { $text, $local, $cmnds } = require('./localization')

////////////////////////////////////////////////
///                  ENGINE                  /// 
////////////////////////////////////////////////
/******** { Scroll down to functions } ********/

const FSTORAGE = [];

const FHANDLERS = [
    "sendmsg",
];

function add(name,handler)
{
    let trigger = $cmnds[name].trigger.map(n => new RegExp(`^${n}`,'i'));
    if(!handler) handler = function(ctx) { ctx.$text(); ctx.sendmsg(); }
    FSTORAGE
        .push(
        {
            trigger : trigger,
            handler : handler,
            template : $cmnds[name].template,
            auth : $cmnds[name].auth
        })    
}

function parsecmnd(text)
{
    let res = {};
    let tokens = text.match(/-?(?:(?:"[\w\s]+")|(?:\w+))/gi)
    if(!tokens.length) return res;

    let fs = { $$root : [] };
    let flag = '$$root';
    let i = -1;
    res.command = tokens[++i];
    while(tokens[++i]) 
    {
        if(token[i][0] === '-') 
        {            
            flag = token[i].substring(1);
            fs[flag] = [];
            continue;
        }
        fs[flag].push(token[i])
    }

    res.args = fs['$$root'];
    delete fs['$$root'];

    res.flags = Object.keys(fs).map(f => { return { name : f, args : fs[f]};});

    return res;

}

function authrefuse(ctx)
{
    ctx.atext = ctx.$local().hi_not_authorized;
    ctx.btns = { type : 'loc', args : ['info'] };
    ctx.sendmsg();
}

class BotAbstruct
{
    constructor(socialuniqe)
    { 
        this.socialuniqe = socialuniqe;
    }
    method(name,func) { this[name] = func; }
    build() 
    {
        for(let f of FHANDLERS) 
            if(!(this[f]&&typeof this[f] === 'function'))
                throw new Error(`Handler ${f} not found`);

        let basectx = {

            sendmsg : this.sendmsg,
            keyup : this.keyup,
            keydown : this.keydown,
            socialtype : this.socialuniqe,

            $text : $text,
            $local : $local

        };

        if(!(FSTORAGE.length && FSTORAGE[FSTORAGE.length-1].template === 'cmnd_not_found'))
            throw new Error(`No empty command at the end`);

        return async function(command,socialid) {

            let user = User.findOne({ socialid : socialid, socialuniqe : this.socialuniqe })
            if(!user)
            {
                user = new User({ socialid : socialid, socialuniqe : this.socialuniqe, targettype : 'byStudent' });
                user.save();
            }

            let i = -1;
            while(!FSTORAGE[++i].targets.filter(c => c.test(command)).length);

            let ctr = FSTORAGE[i];
            if(ctr.auth && !user.targetid) ctr.handler = authrefuse;
            let cmnd = parsecmnd(command);

            let portal = portal.timetable[user.targettype](user.targetid);

            ctr.handler({
                
                $local,

                ...basectx,
                ...cmnd,
                user,
                portal
                
            });

        }
    }
}

////////////////////////////////////////////////
///               FUNCTIONS                  /// 
////////////////////////////////////////////////

const portal = require('node-unn-portal');
portal.modifyon();

add('switch',
async (ctx) => { 

    ctx.atext = ctx.$local().switch_not_found;
    if(!ctx.args[0]) return ctx.sendmsg();
    let lang = ctx.args[0];
    if(lang === 'RU') ctx.user.lng = 1;
    if(lang === 'EN') ctx.user.lng = 2;
    ctx.user.save();
    ctx.atext = ctx.$local().switch_success;
    ctx.sendmsg();

});

add('group',
async (ctx) => {

    ctx.atext = ctx.$local().group_wrong_cmnd;
    if(!ctx.args[0]) return ctx.sendmsg();
    ctx.atext = ctx.$local().group_not_found;
    let portalres = await portal.search.byGroup(ctx.args[0]);
    if(!portalres.length) return ctx.sendmsg();
    if(!portalres[0].id) return ctx.sendmsg();
    ctx.user.targetid = portalres[0].id;
    ctx.user.targetname = ctx.args[0];
    await ctx.user.save();
    //TODO: add keyboard
    ctx.atext = ctx.$local().group_changed;
    ctx.sendmsg();

});

add('hi',
async (ctx) => {

    ctx.template = ctx.user.targetid ? 
        ctx.$local().hi_authorized : ctx.$local().hi_not_authorized;
    ctx.$text(ctx.user);
    ctx.sendmsg();

});

add('commads');
add('information');
add('bug');
add('info');
add('help');
add('bug');

add('keysup',
async (ctx) => {

    ctx.atext = "";
    //buttons
    ctx.sendmsg();

});

add('keysdown',
async (ctx) => {

    ctx.atext = "";
    //buttons
    ctx.sendmsg();

});

add('today',
async (ctx) => {

    let model = await ctx.portal.today();
    ctx.$text(model);
    ctx.sendmsg();

});

add('tommorow',
async (ctx) => {

    let model = await ctx.portal.tommorow();
    ctx.$text(model);
    ctx.sendmsg();

});

add('week',
async (ctx) => {

    let model = await ctx.portal.week();
    ctx.$text(model);
    ctx.sendmsg();

});

add('week2',
async (ctx) => {

    let model = await ctx.portal.week2();
    ctx.$text(model);
    ctx.sendmsg();

});

add('when',
async (ctx) => {

    ctx.atext = ctx.$local().when_wrong_cmnd;
    if(!ctx.args[0]) return ctx.sendmsg();
    let model = await ctx.portal.when(ctx.args[0]);
    ctx.atext = ctx.$local().when_not_found;
    if(!model) return ctx.sendmsg();
    ctx.$text(model);
    ctx.sendmsg();

});

add('where',
async (ctx) => {

    ctx.atext = ctx.$local().where_wrong_cmnd;
    if(!ctx.args[0]) return ctx.sendmsg();
    let model = await ctx.portal.where(ctx.args[0]);
    ctx.atext = ctx.$local().where_not_found;
    if(!model) return ctx.sendmsg();
    ctx.$text(model);
    ctx.sendmsg();

});

add('date',
async (ctx) => {

    ctx.atext = ctx.$local().date_wrong_cmnd;
    if(!ctx.args[0]) return ctx.sendmsg();
    let model = await ctx.portal.date(ctx.args[0]);
    ctx.atext = ctx.$local().date_portal_error;
    if(!model) return ctx.sendmsg();
    ctx.$text(model);
    ctx.sendmsg();

});

add('exams',
async (ctx) => {

    let mounth = new Date().getMonth();
    let model;
    ctx.atext = ctx.$local().exams_not_allowed;
    if(mounth > 3 && mounth < 7) model = await ctx.portal.summerExam();
    else if(mounth > 9 || (mounth >= 0 && mounth <= 1))  model = await ctx.portal.winterExam();
    else return ctx.sendmsg();
    ctx.$text(model);
    ctx.sendmsg();

});

add('remove',
async (ctx) => {

    await ctx.user.delete();
    ctx.$text();
    ctx.sendmsg();

});

add('cmnd_not_found');

////////////////////////////////////////////////
///                 EXPORT                   /// 
////////////////////////////////////////////////

module.exports = BotAbstruct
