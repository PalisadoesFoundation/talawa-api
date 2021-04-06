const axios = require('axios');
const { URL } = require('../constants');
const path = require('path');
const fs = require('fs');

const uploadBody = async (body) => {
  const json = await axios.post(URL, body);
  return json;
};

describe('image upload', () => {
  test('signup test', async () => {
    const body = new FormData();

    body.append(
      'operations',
      JSON.stringify({
        query: `
        mutation ($file: Upload!) {
          signUp (data:{
            email:"user1011@gmail.com",
            firstName:"user_fname",
            lastName:"user_lname",
            password:"Password1234",
          }, file: $file){
            user{
              image
            }
          }
        }
        `,
        variables: {
          file: null,
        },
      })
    );

    const file_name = 'talawa-logo.png';
    body.append(
      'map',
      JSON.stringify({
        1: ['variables.file'],
      })
    );
    body.append('1', fs.createReadStream(path.resolve(__dirname, `./test_image/${file_name}`)));
    const { data } = await uploadBody(body);
    expect(data.errors).toBe(null);
  });
});
