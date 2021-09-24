
const portal = require('node-unn-portal');
portal.modifyon();

let gid;

main();
async function main()
{
    gid = (await portal.search.byGroup("382003-2"))[0].id;
    
    // TEST LIST
    await test_timetable();
}

async function test_timetable()
{
    let tmodel = await portal.timetable.byGroup(gid).week();
}