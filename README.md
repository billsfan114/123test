
## Claim NRC

Claim your running activities from the Nike Run Club mobile app and convert them into GPX format.


### About:

By using this tool, you can extract your NRC running activities and convert them into GPX (GPS eXchange) format, which can then be imported into other fitness tracking apps or services, such as [Strava](https://www.strava.com/upload/select).

![Transfer your NRC activities to Strava](https://i.imgur.com/rIbhSKo.png)

This tool supports providing an access token, or a directory/files of NRC activities in JSON format.

This project was inspired by [NRC Exporter](https://github.com/yasoob/nrc-exporter). It's a JavaScript alternative to the original Python version. You can read how the Python maintainer was able to extract the data from the Nike Run Club app in [this blog post](https://yasoob.me/posts/reverse-engineering-nike-run-club-using-frida-android/), by doing some reverse engineering on the Nike Run Club app's API.
The original project is no longer maintained, and this JavaScript version aims to provide a similar functionality with some improvements.

> The only downside of this tool is that Nike may change their API or even block your account if they detect automated access. However, it should work for now, and you can use it at your own risk.


### Prerequisites:

- [Node.js](https://nodejs.org/en/download) (version 18 or higher) and [npm](https://docs.npmjs.com/getting-started/) (this comes bundled with Node.js) installed on your system.


### Installation:

- Download the repository or clone it using Git:
```shell
git clone git@github.com:boolfalse/claim-nrc.git && cd claim-nrc/
```

- Install dependencies:
```shell
npm install
```

- Run the help command to see available options:
```
node claim-nrc.js --help
```


### Usage:

For claiming your NRC activities, you have to manually provide an access token as an argument. To extract the access token from that browser, check out the [Getting an Access Token](#getting-an-access-token) section below.

- Once you have the access token, you're ready to claim your NRC activities and convert them to GPX format by running this single command:
```
node claim-nrc.js -t <access_token>
```

The output GPX files will be saved in the `activities/gpx/` directory, and the original JSON files will be saved in the `activities/json/` directory. If these directories do not exist, they will be created automatically.

- If you have already downloaded your NRC activities somehow and want to convert that JSON data to GPX data, you put all of those JSON files in a folder and pass that folder's path to `claim-nrc`:
```shell
node claim-nrc.js -i /path/to/folder
```

- You can also pass specific JSON file(s) to convert them to GPX format:
```shell
node claim-nrc.js -i /path/to/file1.json /path/to/file2.json
```


### Getting an Access Token:

The simplest way to retrieve an access token is to run this script in your desktop browser's console as a logged-in user. This will print the access token to the console.
```javascript
JSON.parse(window.localStorage.getItem('oidc.user:https://accounts.nike.com:4fd2d5e7db76e0f85a6bb56721bd51df')).access_token
```

![Access Token in Chrome's Console tab](https://i.imgur.com/0zy5gCw.png)

Alternatively, you can follow these steps to manually retrieve the access token from your browser's developer tools:

1. Open the [Nike website](https://www.nike.com/nrc-app) in your desktop browser.
2. Log in to your account.
3. Open the browser's developer tools (usually by pressing F12 or right-clicking and selecting "Inspect").
4. Go to the "Application" tab in the developer tools.
5. Find the key named "oidc.user:https://accounts.nike.com:<your_nike_account_id>" in the "Local Storage" subsection in the left sidebar.
6. Click on it, and you should see a JSON object with an "access_token" field.
7. Copy the value of the "access_token" field.
8. You can now use this access token with the `-t` option when running the `claim-nrc` command.

![Access Token in Chrome's Application tab](https://i.imgur.com/QXfS1KM.png)


### License:

This project is inspired by [NRC Exporter](https://github.com/yasoob/nrc-exporter/), which is licensed under the MIT License. You can read the license in the [LICENSE](LICENSE) file in this repository.


### Author:

- [BoolFalse](https://boolfalse.com)

