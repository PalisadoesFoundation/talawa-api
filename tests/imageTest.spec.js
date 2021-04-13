const { URL } = require('../constants');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const getToken = require('./functions/getToken');

let token;
beforeAll(async () => {
  token = await getToken();
});

const uploadBody = async (body, token) => {
  const response = await fetch(URL, {
    method: 'POST',
    body,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
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
    const file_name = 'test_image.png';
    body.append(
      'map',
      JSON.stringify({
        1: ['variables.file'],
      })
    );
    body.append(
      '1',
      fs.createReadStream(path.resolve(__dirname, `./test_image/${file_name}`))
    );
    const data = await uploadBody(body);
    expect(data.body.error).toBe(null || undefined);
  });

  test('create organization', async () => {
    const body = FormData();

    body.append(
      'operations',
      JSON.stringify({
        query: `
        mutation ($file: Upload!) {
          signUp (data:{
            name:"test_org",
            description:"Org for testing purpose",
            isPublic: true, 
            visibleInSearch: true
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

    const file_name = 'test_image.png';
    body.append(
      'map',
      JSON.stringify({
        1: ['variables.file'],
      })
    );
    body.append(
      '1',
      fs.createReadStream(path.resolve(__dirname, `./test_image/${file_name}`))
    );

    const data = await uploadBody(body, token);
    expect(data.body.error).toBe(null || undefined);
  });
});
