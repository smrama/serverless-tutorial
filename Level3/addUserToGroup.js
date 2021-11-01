import AWS from "aws-sdk";

exports.handler = function main(event, context, callback) {

    const region = process.env.region;
    const groupName = process.env.groupName;

    console.log("Region:",region);
    console.log("groupName:",groupName);

    AWS.config.update({ region });

    const cognitoISP = new AWS.CognitoIdentityServiceProvider({
        apiVersion: '2016-04-18'
    });

    const params = {
        GroupName: groupName,
        UserPoolId: event.userPoolId,
        Username: event.userName
    };

    console.log("Adding user to group:",params);

    cognitoISP
        .adminAddUserToGroup(params)
        .promise()
        .then(() => callback(null, event))
        .catch(err => callback(err, event));
};