const AWS = require('aws-sdk');
import * as uuidgen from "uuid";
// Create client outside of handler to reuse
//const lambda = new AWS.Lambda();

// Handler
exports.main = async function (event, context) {
    console.log('## ENVIRONMENT VARIABLES: ' + serialize(process.env));
    console.log('## CONTEXT: ' + serialize(context));
    console.log('## EVENT: ' + serialize(event));
    const region = process.env.region;
    try {
        // let accountSettings = await getAccountSettings();
        // let nonsense = serialize(accountSettings.AccountUsage);
        // console.log(nonsense);
        let contentdata = JSON.parse(event.body);

        const params = {
            TableName: process.env.demoTableName,
            Item: {
                pk: uuidgen.v4(),
                content: contentdata.content, // Parsed from request body
                createdAt: Date.now(), // Current Unix timestamp
            },
        };

        console.log("params");
        console.log(params);

        const sts = await new AWS.STS({ region: region });

        const roleparams = {
            RoleArn: event.requestContext.authorizer.claims['cognito:roles'],
            RoleSessionName: 'DemoAdministratorsGroupActivity',
            ExternalId: '9edb3c3a-f1e4-4cac-946d-aa579cc6bc25', //Random Password that only we know
            DurationSeconds: 3600,
        };

        const assumeRoleStep1 = await sts.assumeRole(roleparams).promise();
        console.log('Changed to new role' + event.requestContext.authorizer.claims['cognito:roles']);

        const accessparams = {
            accessKeyId: assumeRoleStep1.Credentials.AccessKeyId,
            secretAccessKey: assumeRoleStep1.Credentials.SecretAccessKey,
            sessionToken: assumeRoleStep1.Credentials.SessionToken,
        };

        console.log("accessparams");
        console.log(accessparams);
        const dynamoDb = await new AWS.DynamoDB.DocumentClient(accessparams);
        await dynamoDb.put(params).promise();

        //return formatResponse(serialize(accountSettings.AccountUsage));
        return formatResponse(serialize(params));

    } catch (error) {
        return formatError(error);
    }
};

var formatResponse = function (body) {
    var response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true
        },
        "isBase64Encoded": false,
        "multiValueHeaders": {
            "X-Custom-Header": ["My value", "My other value"],
        },
        "body": body
    };
    return response;
};

var formatError = function (error) {
    var response = {
        "statusCode": error.statusCode,
        "headers": {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
            "x-amzn-ErrorType": error.code
        },
        "isBase64Encoded": false,
        "body": error.code + ": " + error.message
    };
    return response;
};
// Use SDK client
// var getAccountSettings = function () {
//     return lambda.getAccountSettings().promise();
// };

var serialize = function (object) {
    return JSON.stringify(object, null, 2);
};