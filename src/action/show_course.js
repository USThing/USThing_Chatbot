const moment = require('moment');

const fs = require('fs');
const courses_json = JSON.parse(fs.readFileSync('all_courses.json', 'utf8')).courses;

const getCourseReply = (parameters) => {
  var course_code = parameters.courses;
  // console.log("the passed course code is " + course_code);
  var section_code = parameters.section;
  // console.log("the passed section code is " + section_code);
  var reply = [];

  if (course_code === '' || course_code === undefined || course_code === null) {
    reply[0] = 'No course code detected.'
    return reply;
  }

  var course_code = course_code.toUpperCase().replace(' ', '');
  var course_detail = courses_json[course_code];
  if (course_detail === undefined || course_detail === null) {
    reply[0] = 'Please tell me a valid course code.'
    return reply;
  }

  reply[0] = `There is 1 section in ${course_code}.\n`
  if (course_detail.sections.length > 1) {
    reply[0] = `There are ${course_detail.sections.length} sections in ${course_code}.\n`
  }

  for (var section of course_detail.sections) {
    if (section_code !== '' && section_code !== null && section_code !== undefined) {
      var section_code_fromjson = section.name.replace('0','');
      var section_code_refine = section_code.toUpperCase().replace('0', '');
      console.log("the refined section code is " + section_code_refine);
      if (section_code_refine.includes('LEC') || section_code_refine === 'L') {
        reply[0] = `Let me show you all lectures of ${course_code}.`
        if (section_code_fromjson.toUpperCase().includes('L')) {
          reply.push(getSectionReply(section))
        }
    }else if (section_code_refine.includes('TUT') || section_code_refine === 'T') {
        reply[0] = `Let me show you all tutorials of ${course_code}.`
        if (section_code_fromjson.toUpperCase().includes('T')) {
          reply.push(getSectionReply(section))
        }
    }else if (section_code_refine === 'LAB') {
        reply[0] = `Let me show you all labs of ${course_code}.`
        if (section_code_fromjson.toUpperCase().includes('LA')) {
          reply.push(getSectionReply(section))
        }
      }else {
        if (section_code_fromjson.toUpperCase() === section_code_refine) {
          reply[0] = `Let me show you ${course_code} ${section_code.toUpperCase()}.`;
          reply.push(getSectionReply(section));
          break;
        }else {
          reply[0] = `${section_code} is not a valid section number.`;
        }
      }
    }else {
      reply.push(getSectionReply(section));
    }
  }
  return reply;
};

function getSectionReply(section) {
  var reply = `\n*${section.name}:*`;
  for (var c of section.classes) {
    reply += `\nOn ${c.day}, ${moment(c.start_time).format('hh:mma')} to ${moment(c.end_time).format('hh:mma')} in ${c.location}`
  }
  reply += `\n*Enrolled: ${section.enrol} Available: ${section.avail} Waiting: ${section.wait}*\n`
  return reply;
}

module.exports.reply = getCourseReply;
