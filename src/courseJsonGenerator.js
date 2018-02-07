// copied and modified from Dipsy Wong(dipsywong98) Repo: USThing-FindRoom/node/index.js
const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');
const moment = require('moment');

var links = [];
var courses_dict = {};
var all_courses = [];
var locations = [];
var load_sum = 0;
var $;
var year;
var semester;

var root = 'https://w5.ab.ust.hk/';
var days = {
    Su:{
        id:7,
        text:"Sunday"
    },
    Mo:{
        id:1,
        text:"Monday"
    },
    Tu:{
        id:2,
        text:"Tuesday"
    },
    We:{
        id:3,
        text:"Wednesday"
    },
    Th:{
        id:4,
        text:"Thursday"
    },
    Fr:{
        id:5,
        text:"Friday"
    },
    Sa:{
        id:6,
        text:"Saturday"
    }
}

var start_end_date = {
    Fall:{
        start:"01-SEP-",
        end:"30-NOV-"
    },
    Spring:{
        start:"01-FEB-",
        end:"09-MAY"
    },
    Winter:{
        start:"02-JAN-",
        end:"31-JAN-"
    },
    Summer:{
        start:"18-JUN-",
        start:"15-AUG-"
    }
};

function GetInnerText(element){
    if(!element) return "ignored";
    var str = '';
    for(var i=0; i<element.children.length; i++){
        if(element.children[i]&&element.children[i].data) str += element.children[i].data
        else str += '|';
    }
    return str;
}

function StrContain(str1, str2){
    return str1.indexOf(str2) !== -1;
}

function sleep(millis){
    var date = new Date();
    var curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}

request(root+'wcq/cgi-bin/1730/subject/ACCT', function (error, response, body) {

    $ = cheerio.load(body);

    // console.log(body);

    var semester_str = GetInnerText($('a[href*="#"]')[0]);
    [year,semester] = semester_str.split(' ');
    // console.log(semester_str, year, semester);
    if(semester.indexOf('Fall') !== -1){
        year = year.split('-')[0];
    }
    else{
        year = '20'+year.split('-')[1];
    }

    console.log(year, semester);
    // console.log(start_end_date,year,semester)

    GetCourseLinks();
    console.log(links);
    // for(var i=0; i<links.length; i++){
        PushCoursesByURL(links[0],0);
    // }

    //  PushCoursesByURL('https://w5.ab.ust.hk/wcq/cgi-bin/1710/');
    // PushCoursesByURL('http://localhost/class/class/w5.ab.ust.hk/wcq/cgi-bin/1640/')

});

 function GetCourseLinks(){
    var anchors = $('a.ug');
    for (var i=0; i<anchors.length; i++){
        links.push(root+anchors[i].attribs.href.split('https://w5.ab.ust.hk/').join(''));
    }
    var anchors = $('a.pg');
    for (var i=0; i<anchors.length; i++){
        links.push(root+anchors[i].attribs.href.split('https://w5.ab.ust.hk/').join(''));
    }
 }

function PushCoursesByURL(url,links_index){
    if(root.indexOf('localhost')!==-1) url+='.html';
    sleep(300);
    request(url ,function (error ,response ,body){

        $ = cheerio.load(body);

        console.log(url);

        var raw_courses = $('div.course');

        //for each course in courses
        for(var i=0; i<raw_courses.length; i++){
            var raw_course = $(raw_courses[i]);
            var sections = raw_course.find('tr').filter('[class!=""]');

            var course = BuildHeading(GetInnerText(raw_course.find('h2')[0]));
            course.details = BuildDetails($(raw_course.find('.courseinfo')[0]).find('tbody'));
            course.sections= BuildSections(sections);

            all_courses.push(course);
            courses_dict[course.id] = course;

        }

        //loaded all courses
        if(++load_sum>=links.length){
            fs.writeFile("../courses_dict.json", JSON.stringify({courses:courses_dict}), function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log("The file was saved!");
            });
            // console.log(all_courses);
        }

        console.log("Retreived : "+(links_index+1)+"/"+links.length)
        if(++links_index<links.length) PushCoursesByURL(links[links_index],links_index);
    })
}

function BuildSections(raw_sections){
    var sections = [];
    //for each sections(tr)
    for(var i=0; i<raw_sections.length; i++){
        //get its detials (td)
        var details = $(raw_sections[i]).find('td');
        if(StrContain(raw_sections[i].attribs.class,'newsect')){
            //new section
            var name_list = GetInnerText(details[0]).split(' ');
            sections.push({
                name:name_list[0],
                class_number:name_list[1].split('(')[1].split(')')[0],
                classes:[],
                instructors:BuildInstructors(details[3]),
                quota:BuildQuota(details[4]),
                enrol:GetInnerText(details[5]),
                avail:GetInnerText($(details[6]).find('strong')[0]||details[6]),
                wait:GetInnerText($(details[7]).find('strong')[0]||details[7]),
                remarks:BuildRemarks(details[8])
            })
        }
        else{
            //if it is extened row for previous section
            details.splice(0,0,"");
        }
        var section = sections[sections.length-1];
        var _classes = BuildClasses(section,details);
        if(_classes == "TBA"){
            section.classes="TBA";
        }
        else{
            while(_classes.length>0){
                section.classes.push(_classes.pop());
            }
        }

    }
    return sections;
}

function BuildRemarks(raw_td){
    var remarks = {};
    if($(raw_td).find('.consent')[0]) remarks.consent = true;
    if($(raw_td).find('.classnotes')[0]) remarks.classnotes = GetInnerText($($(raw_td).find('.classnotes')[0]).find('.popupdetail')[0]);
    return remarks;
}

function BuildQuota(raw_td){
    var quota_spans = $(raw_td).find('span');
    var quota_total = GetInnerText(quota_spans[0] || raw_td);
    var hold_set = {};
    var quota_hold = 0;
    if(quota_spans[0]){
        var quota_detail = $(raw_td).find('.quotadetail')[0];
        // console.log(GetInnerText(quota_detail));
        var hold_list = GetInnerText(quota_detail).match(/[A-Z]+( \([a-z]+\))*: [0-9]+\/[0-9]+\/[0-9]+/g);
        // console.log(hold_list);
        for(var i=0; i<hold_list.length; i++){
            var [department,detail] = hold_list[i].split(': ');
            var [quota,enrol,avail] = detail.split('/');
            hold_set[department] = {quota:quota,enrol:enrol,avail:avail};
            quota_hold += Number(quota);
        }
    }
    return {
        total:quota_total,
        hold:hold_set,
        public:quota_total - quota_hold
    };
}

function BuildClasses(section,details){
    var classes=[];
    var time_str = GetInnerText(details[1]);
    var location = GetInnerText(details[2]);
    var note="N/A";
    var start_time = 0;
    var end_time = 0;
    var start_date = 0;

    //record new locations
    if(location!="TBA"&&locations.indexOf(location)==-1){
        locations.push(location);
    }

    //no class
    if(time_str=="TBA"&&location=="TBA"){
        return "TBA";
    }

    // console.log(time_str)

    //split the date constrain and time
    if(StrContain(time_str,"|")){
        [note,time_str] = time_str.split("|");
        [start_date,end_date] = note.split(" - ");
    }
    else{
        // console.log(start_end_date, semester);
        // [start_date,end_date] = start_end_date[semester];
        start_date = start_end_date[semester].start+year;
        end_date = start_end_date[semester].end+year;
    }

    // console.log(start_date,end_date);

    //split the week days
    for(var day in days){
        time_str = time_str.replace(day," "+day);
    }
    time_strs = time_str.split(" ");

    for(var i=time_strs.length-1; i>0; --i){
        var str = time_strs[i];
        if(StrContain("MoTuWeThFrSaSu",str)){
            //talking about week days
            var weekday = days[str].id;
            var start_time_moment = moment(start_date+start_time,'DD-MMM-YYYYhh:mma');
            var end_time_moment = moment(end_date+end_time,'DD-MMM-YYYYhh:mma');
            ShiftClassDay(start_time_moment,end_time_moment,weekday);

            // console.log(start_date,start_time_moment,end_date,end_time_moment,weekday)
            // console.log(start_time,moment(start_time,'hh:mma').format(),";",end_time,moment(end_time,'hh:mma').format())
            classes.push({
                day:days[str].text,
                start_time: start_time_moment.format(),
                end_time: end_time_moment.format(),
                location: location,
                note: note
            });
        }
        if(StrContain(str,":")){
            if(end_time == 0) end_time = str;
            else start_time = str;
        }
    }
    // console.log(classes);
    return classes;
}

function BuildInstructors(raw_td){
    var instructors = [];
    var raw_a = $(raw_td).find('a');
    if(!raw_a[0]) return GetInnerText(raw_td);
    for(var i=0; i<raw_a.length; i++){
        instructors.push(GetInnerText(raw_a[i]));
    }
    return instructors;
}

function ShiftClassDay(start_time_moment, end_time_moment, weekday){
    while(Number(start_time_moment.day())!=Number(weekday)%7){
        // console.log('start', start_time_moment.day() , weekday)
        start_time_moment.add(1,'d');
    }
    while(Number(end_time_moment.day())!=Number(weekday)%7){
        // console.log('end', end_time_moment.day() , weekday)
        end_time_moment.subtract(1,'d');
    }
    return [start_time_moment,end_time_moment];
}

function BuildDetails(raw_info){
    details = {};
    var raw_details = $(raw_info).find('tr');
    for(var i=0; i<raw_details.length; i++){
        var td = $($(raw_details)[i]).find('td')[0];
        var th = $($(raw_details)[i]).find('th')[0];
        if(GetInnerText(th).split('|').length>1) continue;
        if(th&&td){
            var index = GetInnerText(th).toLowerCase();
            var content = GetInnerText(td)
            details[index] = BuildDetailsContent(index,content);
        }
    }
    return details;
}

function BuildDetailsContent(index,content){
    // if("requisite exclusion attributes".indexOf(index) == -1) return content;
    // console.log(index);
    switch(index){
        case 'attributes':
        // console.log(content);
        var cc_list = content.split('|');
        var content = [];
        for(var i=0; i<cc_list.length; i++){
            if(cc_list[i].indexOf('4Y')==-1) continue;
            content.push(cc_list[i].split('(')[1].split(')')[0]);
        }
        return content;

        case 'co-requisite':
        case 'pre-requisite':
        case 'exclusion':
        case 'co-list with':
        case 'previous code':

        list = content.split(/[\,,;]/g);
        content = [];
        for(var i=0; i<list.length; i++){
            var course = list[i].match(/[A-Z]{4} [0-9]{3,4}[A-Z]*/g);
            if(course) content.push({course:course[0].split(' ').join('')});
            else content.push({other:list[i]});
        }
        return content;

        default:
        return content;
    }
}

function BuildHeading(h2_str){
    var course_code = h2_str.split(' - ')[0];
    var course_name = h2_str.split(/[A-Z]{4} [0-9]{4}[A-Z]* - /g)[1];
    // console.log(course_code, " ", course_name);
    var [department,code] = course_code.split(' ');
    var [name,credit] = course_name.split(' (');
    credit = credit.split(' unit')[0];
    return {
        id:course_code.split(' ').join(''),
        department:department,
        code:code,
        name:name,
        credit:credit
    }
}
