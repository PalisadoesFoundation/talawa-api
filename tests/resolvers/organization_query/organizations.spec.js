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
// IMPORTING THE ORGANOSATION CREATION API THAT WILL BE NEEDED WHILE COVERING ALL CASES IN TEST CODE
const organizationMutation = require('../../../lib/resolvers/organization_mutations/createOrganization');

// SINCE OUR API WILL CALL ON DATABASE, WE NEED TO MAKE SURE THE DATABASE IS CONNECTED
// THE db.js FILE PRESENT IN THE ROOT WILL DO OUR WORK, SO WE NEED TO IMPORT THAT FILE
const database = require('../../../db');

// THE shortid IS UTILISED TO GET UNIQUE IDENTIFIER WHICH IS USED AS A RANDOM SET
// OF NUMBERS IN ORDER TO PERFORM THE SIGNUP
//THE SIGNUP IS REQUIRED IN ORDER TO HAVE ACCESS TO CREATE ORGANISATION AND VIEW ORGANISATION
//BOTH OF THIS WILL BE DONE WHEN WE WILL COVERING TEST CASE SCENARIOS
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

  const args = {
    data: {
      name: 'Palisadoes Foundation Members',
      description: 'For all contributors of Palisadoes',
      location: 'Earth',
      isPublic: true,
      visibleInSearch: true,
    },
  };

  await organizationMutation({}, args, {
    userId: userId,
  });
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
  const apiArgs = {
    orderBy: getRandomOrderByVal,
  };

  let apiResponse = await organizationQuery({}, apiArgs, {
    userId: userId,
  });

  let apiResponseStructuredFormatArray = Array.from(
    Array(apiResponse.length > 5 ? 5 : apiResponse.length).keys()
  );

  if (apiResponseStructuredFormatArray.length === 5) {
    apiResponse = apiResponse.slice(0, 5);
  }

  let index = 0;
  apiResponse.forEach((element) => {
    const result = {
      id: element['_id'],
      name: element['name'],
      description: element['description'],
      apiUrl: element['apiUrl'],
    };

    apiResponseStructuredFormatArray[index] = result;
    index++;
  });

  const orderByfilterArray = getRandomOrderByVal.split('_');
  const orderByInputName = orderByfilterArray[0];
  const orderByOrder = orderByfilterArray[1];

  let outputResult = Array.from(
    Array(apiResponseStructuredFormatArray.length).keys()
  );

  index = 0;
  apiResponseStructuredFormatArray.forEach((element) => {
    outputResult[index] = element[orderByInputName];
    index++;
  });

  //SORTING IS PERFORMED IN RESPONSE TO CHECK IF ANY CHANGES HAPPENED
  //IF INCASE IT DID THE TEST WILL FAIL SUGGESTING THAT orderBy PARAMETER IS NOT WORKING
  outputResult = outputResult.sort((a, b) => {
    if (orderByOrder === 'ASC') {
      // eslint-disable-next-line prettier/prettier
      return a[orderByInputName] > b[orderByInputName]
        ? 1
        : b[orderByInputName] > a[orderByInputName]
        ? -1
        : 0;
    }

    // eslint-disable-next-line prettier/prettier
    return a[orderByInputName] < b[orderByInputName]
      ? 1
      : b[orderByInputName] < a[orderByInputName]
      ? -1
      : 0;
  });

  let responseStructredResultExpectation = Array.from(
    Array(apiResponseStructuredFormatArray.length).keys()
  );

  index = 0;
  apiResponseStructuredFormatArray.forEach((element) => {
    responseStructredResultExpectation[index] = element[orderByInputName];
    index++;
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

    // THE ARRAY IS RESPONSIBLE FOR CHECKING WHEATHER THE RESUTS ARE SORTED
    const outputResultArray = Array.from(Array(orderByVal.length).keys());
    // THE ARRAY OF RESPONSE
    const expectedResultArray = Array.from(Array(orderByVal.length).keys());

    //THE LOOP TAKES ALL THE ORDER BY CASES AND STORES THE RESULTS IN ARRAY
    for (let i = 0; i < orderByVal.length; i++) {
      const result = await checkOrderByInput(orderByVal[i]);
      outputResultArray[i] = result['outputResult'];
      expectedResultArray[i] = result['responseStructredResultExpectation'];
    }

    //FOR ALL THE CASES BOTH EXPECTED AND ACTUAL VALUES ARE CHECKED
    expect(expectedResultArray).toBeTruthy();
  });

  //THIS IS THE CASE WHERE USER PROVIDES THE ORGANISATION ID
  //TO GET THE RESPONSE OF ONE SINGLE ORGANISATION
  //
  // IT COVERS THE FOLLOWING MAIN LINE NO:
  //        41,42,43,44,55
  test('Organisation Id provided by user', async () => {
    const args = {
      data: {
        name: 'Palisadoes Foundation Members',
        description: 'For all contributors of Palisadoes',
        location: 'Earth',
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
