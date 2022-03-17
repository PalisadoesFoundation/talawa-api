//---------------------**************************************--------------------------------------
//THE PURPOSE OF THIS FILE IS TO CHECK THE TEST CODE FOR @[organizations] API
//IN ORDER TO GET THE COVERAGE OF 100% WE NEED TO MAKE SURE THAT ALL THE
//POSSIBLE CASES ARE CONSIDERED WHILE WRITING TEST CODE COVERING EVERY LINE OF CODE in @[organizations] API FUNCTION
//
//PLEASE NOTE THAT COVERAGE OF 100% WILL ONLY BE GENERATED IF EACH LINE OF MAIN FUNCTION IS RUN BY TEST CODE
//
//---------------------**************************************--------------------------------------

// IMPORTING THE API THAT NEEDS TO BE TESTED FROM THE DESIRE RESOLVER FUNCTION
const organizationQuery = require('../../../lib/resolvers/organization_query/organizations');
const organizationMutation = require('../../../lib/resolvers/organization_mutations/createOrganization');

// SINCE OUR API WILL CALL ON DATABASE, WE NEED TO MAKE SURE THE DATABASE IS CONNECTED
// THE db.js FILE PRESENT IN THE ROOT WILL DO OUR WORK
const database = require('../../../db');

// THE shortid IS UTILISED TO GET UNIQUE IDENTIFIER WHICH IS USED AS A RANDOM SET
// OF NUMBERS IN ORDER TO PERFORM THE SIGNUP
const shortid = require('shortid');

// THE FUNCTION PURPOSE IS TO SIGNUP A USER AND GET THE ITS UNIQUE ID
// AS IT WILL BE UTILISED WHILE CALLING THE FUNCTION QUERY
const getUserId = require('../../functions/getUserIdFromSignup');

// THE GLOBAL VARIABLE WHICH WILL STORE THE USER ID AFTER THE SIGNUP
let userId;

// BEFORE TESTING OUR QUERY WE NEED TO MAKE SURE OF THE FOLLOWING REQUIREMENTS
// 1. OUR DATABASE IS UP AND RUNNING
// 2. OUR USER IS SIGNED UP OR LOGGED IN
//
// IN ORDER TO MAKE SURE OUR DATABASE IS RUNNING, OUR ENVIRONMENT VARIABLES
// NEEDS TO BE CONFIGURED
//
// BELOW FUNCTION MAKE SURE ALL THE ABOVE WORKS ARE DONE
beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserId(generatedEmail);
});

//AFTER WE ARE DONE WITH OUR TESTING WE NEED TO CLOSE DOWN THE DATABASE TO AVOID
//RUNNING MULTIPLE CONNECTION ON THE SAME DATABASE SERVER WHICH WILL INCREASE ITS LOAD
afterAll(() => {
  database.disconnect();
});

//THE PURPOSE OF THE FUNCTION IS TO RETURN RESULTS PROVIDED AND ACCEPTED
//IF ORDERY INPUT PARAMETER IS PROVIDED BY THE USER
//
//SINCE WE HAVE 8 ORDERBY PARAMETERS ARE POSSIBLE WE NEED TO CHECK
//EVERY SINGLE ONE IN ORDER TO GET COVERAGE TO 100%
const checkOrderByInput = async (val) => {
  const getRandomOrderByVal = val;
  const args = {
    orderBy: getRandomOrderByVal,
  };

  let response = await organizationQuery({}, args, {
    userId: userId,
  });

  let responseStructredResult;
  if (response.length > 5) {
    response = response.slice(0, 5);
    responseStructredResult = Array.from(Array(5).keys());
  } else {
    responseStructredResult = [] * response.length;
  }

  let index = 0;
  response.forEach((element) => {
    const result = {
      id: element['_id'],
      name: element['name'],
      description: element['description'],
      apiUrl: element['apiUrl'],
    };

    responseStructredResult[index] = result;
    index++;
  });

  const filterName = getRandomOrderByVal.split('_');
  let outputResult = Array.from(Array(responseStructredResult.length).keys());
  let i = 0;

  responseStructredResult.forEach((element) => {
    outputResult[i] = element[filterName[0]];
    i++;
  });

  const argName = filterName[0];
  outputResult = outputResult.sort((a, b) =>
    a[argName] > b[argName] ? 1 : b[argName] > a[argName] ? -1 : 0
  );

  let responseStructredResultExpectation = Array.from(
    Array(responseStructredResult.length).keys()
  );

  let t = 0;
  responseStructredResult.forEach((element) => {
    responseStructredResultExpectation[t] = element[filterName[0]];
    t++;
  });

  return {
    outputResult: outputResult,
    responseStructredResultExpectation: responseStructredResultExpectation,
  };
};

// OUR TEST NEEDS TO BE BREAKDOWN INTO SEVERAL SMALLER CASES AND THEY
// NEEDS TO BE GROUP UNDER ONE
//
// DESCRIBE FORMS THE GROUP UNDER WHICH ALL SCENRAIO WILL BE TESTED FOR A GIVEN API
describe('Organization Query', () => {
  // THIS IS THE FIRST TEST CASE WHERE NO PARAMETERS IS PROVIDED BY THE USER
  // IN THE CASE ARRAY OF ORGANIZATIONS IS EXPECTED AS RESULTS
  //
  // IT COVERS THE FOLLOWING MAIN LINE NO:
  //        11,12,35,39,57
  test('Without any input arguments by user', async () => {
    const response = await organizationQuery(
      {},
      {},
      {
        userId: userId,
      }
    );

    expect(response).toEqual(expect.any(Array));
  });

  // THIS IS THE CASE WHEN USER PROVIDES ORDERBY INPUT IN API
  //IF WE LOOK CAREFULLY THIS COVERS THE MAIN PART OF OUR API FILE AND TEST MAJOR LINES
  //
  // IT COVERS THE FOLLOWING MAIN LINE NO:
  //        16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32
  test('orderBy input arguments provided by user', async () => {
    const orderByVal = [
      'id_ASC',
      'id_DESC',
      'name_ASC',
      'name_DESC',
      'description_ASC',
      'description_DESC',
      'apiUrl_ASC',
      'apiUrl_DESC',
    ];

    const outputResultArray = Array.from(Array(orderByVal.length).keys());
    const expectedResultArray = Array.from(Array(orderByVal.length).keys());

    //THE LOOP TAKES ALL THE ORDER BY CASES AND STORES THE RESULTS IN ARRAY
    for (let i = 0; i < orderByVal.length; i++) {
      const result = await checkOrderByInput(orderByVal[i]);
      outputResultArray[i] = result['outputResult'];
      expectedResultArray[i] = result['responseStructredResultExpectation'];
    }

    //FOR ALL THE CASES BOTH EXPECTED AND ACTUAL VALUES ARE CHECKED
    expect(outputResultArray).toEqual(expectedResultArray);
  });

  //THIS IS THE CASE WHERE USER PROVIDES THE ORGANISATION ID
  //TO GET THE RESPONSE OF ONE SINGLE ORGANISATION
  //
  // IT COVERS THE FOLLOWING MAIN LINE NO:
  //        41,42,43,44,55
  test('Organisation Id provided by user', async () => {
    const args = {
      data: {
        name: 'Sumitra Saksham Org',
        description: 'My Club',
        location: 'Muzaffarpur',
        isPublic: true,
        visibleInSearch: true,
      },
    };
    const newOrganization = await organizationMutation({}, args, {
      userId: userId,
    });

    const queryResponse = await organizationQuery(
      {},
      {
        id: newOrganization['_id'],
      },
      {
        userId: userId,
      }
    );

    expect(queryResponse).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: newOrganization['_id'],
        }),
      ])
    );
  });

  //THIS IS THE CASE WHERE USER PROVIDES THE WRONG ORGANISATION ID
  //IN THIS CASE TEST CODE CHECKS IF ERROR IS THROWN OR NOT
  //
  // IT COVERS THE FOLLOWING MAIN LINE NO:
  //        46,47,48,49,50,51,52,53
  test("Organisation Id provided by user doesn't exist", async () => {
    await expect(async () => {
      await organizationQuery(
        {},
        {
          id: '60528166cc96e8d1bf2ace99',
        },
        {
          userId: userId,
        }
      );
    }).rejects.toEqual(Error('Organization not found'));
  });
});
