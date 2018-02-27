const request = require("request");

const getRoomReply = function (entities) {
  return new Promise((resolve, reject) => {
    var reply = [];
    var venue = '';
    if (!entities.venue[0].value) {
      reply[0] = 'No venue detected.'
      console.log(reply);
      resolve(reply);
    } else {
      venue = entities.venue[0].value;
    }
    if (venue.match(/\W+/g)) {
      venue = venue.replace(/\W+/g, '');
    }
    if (venue.includes('room') || venue.includes('rm')) {
      venue = venue.match(/\d+/g);
    }
    venue = venue.toString()
    var options = { method: 'GET',
      url: 'http://pathadvisor.ust.hk/phplib/search.php',
      qs:
       { keyword: venue,
         floor: 'Overall',
         type: 'lift',
         same_floor: 'yes'
       }
    };
    var matchedRooms = []
    request(options, function (err, response, body) {
      if (err) reject(err);
      for (let line of body.split('\n')){
        if (line.length > 4){
          // console.log(line);
          matchedRooms.push(line);
        }
      }
      if (matchedRooms.length === 0) {
        reply[0] = `Sorry we cannot find rooms related to ${venue}`;
        console.log('no match room from API');
        resolve(reply);
      } else {
        reply[0] = 'Here are the related results:';
        for (let room of matchedRooms) {
          let set = room.split(';');
          let building = set[set.length-2].match(/\D+/g);
          if (building) {
            building = building.toString();
          }
          if (building === 'LG' || building === 'G' || building === null){
            building = 'Academic Building';
          } else if (building.includes('NAB')) {
            building = 'LSK';
          } else if (building.includes('G')) {
            building = building.replace('G', '');
          }
          reply.push(`Room number: ${set[set.length-1]}, Building: ${building}, Lift Number: ${set[0].split(' ')[1]}`)
          // console.log(`pushed ${set[set.length-1]}`);
        }
        // console.log(`the reply array is \n ${reply}`);
        resolve(reply);
      }
    });
  });
}

module.exports = {reply:getRoomReply};
