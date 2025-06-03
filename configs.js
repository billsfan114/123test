
module.exports = {
    activitiesJsonFolderName: 'json',
    activitiesGpxFolderName: 'gpx',
    nikeLocalStorageKey: 'oidc.user:https://accounts.nike.com:4fd2d5e7db76e0f85a6bb56721bd51df',
    url: {
        login: 'https://www.nike.com/in/launch?s=in-stock',
        mobileLogin: 'https://unite.nike.com/s3/unite/mobile.html?androidSDKVersion=3.1.0"' +
            '&corsoverride=https://unite.nike.com&uxid=com.nike.sport.running.droid.3.8"' +
            '&locale=en_US&backendEnvironment=identity&view=login"' +
            '&clientId=WLr1eIG5JSNNcBJM3npVa6L76MK8OBTt&facebookAppId=84697719333"' +
            '&wechatAppId=wxde7d0246cfaf32f7',
        activitiesList: 'https://api.nike.com/plus/v3/activities/before_id/v3/*' +
            '?limit=30&types=run%2Cjogging&include_deleted=false',
        activitiesListPagination: 'https://api.nike.com/plus/v3/activities/before_id/v3/{before_id}' +
            '?limit=30&types=run%2Cjogging&include_deleted=false',
        activityDetails: 'https://api.nike.com/sport/v3/me/activity/{activity_id}?metrics=ALL',
    },
    css: {
        loginBtn: 'button.join-log-in.text-color-grey.prl3-sm.pt2-sm.pb2-sm.fs12-sm.d-sm-b',
        emailInput: 'input[data-componentname="emailAddress"]',
        passwordInput: 'input[data-componentname="password"]',
        loginDialog: 'div[class="d-md-tc u-full-width u-full-height va-sm-m"]',
        submitBtn: 'div.nike-unite-submit-button.loginSubmit.nike-unite-component input[type="button"]',
    }
};
