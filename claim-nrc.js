
/**
 * Claim your NRC activities and convert them to GPX format.
 */

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { program } = require('commander');
const { buildGPX, GarminBuilder } = require('gpx-builder');
const { Point } = require('gpx-builder/dist/builder/BaseBuilder/models');
const configs = require('./configs');

const activitiesJsonFolderPath = path.join(process.cwd() + '/activities', configs.activitiesJsonFolderName);
const activitiesGpxFolderPath = path.join(process.cwd() + '/activities', configs.activitiesGpxFolderName);

/**
 * Gets the list of activity IDs from Nike Run Club (NRC) API
 * @param {Object} options - an object which contains the access token
 * @returns {Array} - list of running activity IDs
 */
async function getActivitiesList(options) {
    console.info('Getting activities list...');
    const headers = {
        'Authorization': `Bearer ${options.accessToken}`,
    };

    const activityIds = [];
    let pageNum = 1;
    let nextPage = configs.url.activitiesList;
    let more = true;
    let isError = false;

    while (more) {
        console.info(`Opening page ${pageNum} of activities.`);

        try {
            const response = await axios.get(nextPage, { headers });
            const activityList = response.data;

            if (activityList.error_id) {
                console.error('Are you sure you provided the correct access token?');
                process.exit(1);
            }

            for (const activity of activityList.activities) {
                if (activity.type === 'run' &&
                    activity.tags?.['com.nike.running.runtype'] !== 'manual') {
                    activityIds.push(activity.id);
                }
            }

            if (activityList.paging?.before_id) {
                pageNum += 1;
                const activitiesListPaginationUrl = configs.url.activitiesListPagination;
                nextPage = activitiesListPaginationUrl.replace('{before_id}', activityList.paging.before_id);
                continue;
            }

            break;
        } catch (err) {
            isError = true;
            if (err.response && err.response.status === 401) {
                console.error('Unauthorized access. Please check your access token!');
                process.exit(1);
            } else {
                console.error(`Error fetching activities: ${err.message}. Please check your access token or network connection!`);
            }
        }
    }

    if (isError) {
        process.exit(1);
    }

    console.info(`Successfully extracted ${activityIds.length} running activities from ${pageNum} pages.`);

    return activityIds;
}

/**
 * Extracts details for a specific activity
 * @param {string} activityId - ID of the activity to fetch
 * @param {Object} options - an object which contains the access token
 * @returns {Object} - the activity details
 */
async function getActivityDetails(activityId, options) {
    console.info(`Getting activity details for ${activityId}...`);

    const headers = {
        'Authorization': `Bearer ${options.accessToken}`,
    };

    try {
        const activityDetailsUrl = configs.url.activityDetails
        const response = await axios.get(activityDetailsUrl.replace('{activity_id}', activityId), { headers });

        return response.data;
    } catch (err) {
        console.error(`Error fetching activity details: ${err.message}`);
        return null;
    }
}

/**
 * Saves activity data to disk
 * @param {Object} activityJson - activity data
 * @param {string} activityId - ID of the activity
 */
function saveActivity(activityJson, activityId) {
    const jsonPath = path.join(activitiesJsonFolderPath, `${activityId}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(activityJson));
}

/**
 * Parses the latitude, longitude and elevation data to generate a GPX document
 * @param {string} title - the title of the GPX document
 * @param {Array} latitudeData - list of objects containing latitude data
 * @param {Array} longitudeData - list of objects containing longitude data
 * @param {Array} elevationData - list of objects containing elevation data
 * @param {Array} heartRateData - list of objects containing heart rate data
 * @returns {string} - GPX XML document
 */
function generateGpx(title, latitudeData, longitudeData, elevationData, heartRateData) {
    const builder = new GarminBuilder();
    const points = [];

    function updatePoints(pointsList, updateData, updateName) {
        let counter = 0;
        for (const p of pointsList) {
            while (p.startTime >= updateData[counter].end_epoch_ms) {
                if (counter === updateData.length - 1) {
                    break;
                }
                p[updateName] = updateData[counter].value;
                counter += 1;
            }
        }
    }

    for (let i = 0; i < latitudeData.length; i++) {
        const lat = latitudeData[i];
        const lon = longitudeData[i];

        if (lat.start_epoch_ms !== lon.start_epoch_ms) {
            console.error('\tThe latitude and longitude data is out of order!');
        }

        points.push({
            latitude: lat.value,
            longitude: lon.value,
            startTime: lat.start_epoch_ms,
            time: new Date(lat.start_epoch_ms),
        });
    }

    if (elevationData) {
        updatePoints(points, elevationData, 'elevation');
    }

    if (heartRateData) {
        updatePoints(points, heartRateData, 'heartRate');
    }

    const gpxPoints = points.map(p => {
        const point = new Point(p.latitude, p.longitude, {
            time: p.time,
            ele: p.elevation,
        });

        if (p.heartRate) {
            point.extensions = [{
                'gpxtpx:TrackPointExtension': {
                    'gpxtpx:hr': p.heartRate
                }
            }];
        }

        return point;
    });

    const { Track, Segment } = GarminBuilder.MODELS;
    const track = new Track([new Segment(gpxPoints)], { name: title });
    builder.setTracks([track]);

    return buildGPX(builder.toObject());
}

/**
 * Parses a NRC activity and returns GPX XML
 * @param {Object} activity - a JSON document for a NRC activity
 * @returns {string} - the GPX XML doc for the input activity
 */
function parseActivityData(activity) {
    let latIndex = null;
    let lngIndex = null;
    let ascentIndex = null;
    let heartRateIndex = null;

    if (!activity.metrics) {
        console.warn(`\tThe activity ${activity.id} doesn't contain metrics information!`);
        return null;
    }

    for (let i = 0; i < activity.metrics.length; i++) {
        const metric = activity.metrics[i];
        if (metric.type === 'latitude') {
            latIndex = i;
        }
        if (metric.type === 'longitude') {
            lngIndex = i;
        }
        if (metric.type === 'ascent') {
            ascentIndex = i;
        }
        if (metric.type === 'heart_rate') {
            heartRateIndex = i;
        }
    }

    if (latIndex === null || lngIndex === null) {
        console.warn(`\tThe activity ${activity.id} doesn't contain latitude/longitude information!`);
        return null;
    }

    const latitudeData = activity.metrics[latIndex].values;
    const longitudeData = activity.metrics[lngIndex].values;
    let elevationData = null;
    let heartRateData = null;

    if (ascentIndex !== null) {
        elevationData = activity.metrics[ascentIndex].values;
    }

    if (heartRateIndex !== null) {
        heartRateData = activity.metrics[heartRateIndex].values;
    }

    const title = activity.tags?.['com.nike.name'] || '';

    const gpxDoc = generateGpx(title, latitudeData, longitudeData, elevationData, heartRateData);
    console.info(`Activity ${activity.id} successfully parsed.`);

    return gpxDoc;
}

/**
 * Saves the GPX data to a file on disk
 * @param {string} gpxData - the GPX XML doc
 * @param {string} activityId - the name of the file
 */
function saveGpx(gpxData, activityId) {
    const filePath = path.join(activitiesGpxFolderPath, `${activityId}.gpx`);
    fs.writeFileSync(filePath, gpxData);
}

/**
 * Creates the necessary directories
 */
function createOutputFolders() {
    if (!fs.existsSync(activitiesGpxFolderPath)) {
        fs.mkdirSync(activitiesGpxFolderPath);
    }

    if (!fs.existsSync(activitiesJsonFolderPath)) {
        fs.mkdirSync(activitiesJsonFolderPath);
    }
}

/**
 * Parses command line arguments
 * @returns {Object} - options object
 */
function parseArguments() {
    program
        .description('Claim your NRC activities and convert them to GPX format.')
        .option('-t, --token <token>', 'access token retrieved from the browser')
        .option('-i, --input <paths...>', 'A directory or directories containing NRC activities in JSON format. You can also provide individual NRC JSON files');

    program.parse(process.argv);

    const options = program.opts();

    const result = {
        manual: false
    };

    if (options.input) {
        const inputPaths = Array.isArray(options.input) ? options.input : [options.input];

        if (inputPaths.every(i => fs.existsSync(i))) {
            result.activitiesDirs = inputPaths;
        }

        if (inputPaths.every(i => i.endsWith('.json'))) {
            result.activitiesFiles = inputPaths;
        }
    } else if (options.token) {
        result.accessToken = options.token;
    } else {
        result.manual = true;
        console.info('You will need to manually provide an access token!');
    }

    return result;
}

/**
 * Main function
 */
async function main() {
    createOutputFolders();
    const options = parseArguments();

    const startTime = Date.now();

    if (options.accessToken) {
        console.info('Claiming NRC activities...');

        const activityIds = await getActivitiesList(options);
        if (activityIds.length === 0) {
            console.error('No activities found!');
            process.exit(0);
        }

        for (const activityId of activityIds) {
            const activityDetails = await getActivityDetails(activityId, options);
            if (activityDetails) {
                saveActivity(activityDetails, activityDetails.id);
            }
        }
    }

    const activityFolders = options.activitiesDirs || [activitiesJsonFolderPath];
    let activityFiles = options.activitiesFiles || [];

    if (activityFiles.length === 0) {
        for (const folder of activityFolders) {
            // add a path to every file in the folder
            const files = fs.readdirSync(folder).map(f => path.join(folder, f));
            activityFiles = activityFiles.concat(files);
        }
        console.info(`Parsing activity JSON files from the ${activityFolders.join(',')} folder(s).`);
    }

    let totalParsedCount = 0;

    for (const filePath of activityFiles) {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            const jsonData = JSON.parse(fileContent);

            const parsedData = parseActivityData(jsonData);

            if (parsedData) {
                totalParsedCount += 1;
                saveGpx(parsedData, jsonData.id);
            }
        } catch (err) {
            console.error(`Error occurred while parsing file ${filePath}: ${err.message}`);
        }
    }

    console.info(`Parsed ${totalParsedCount} out of ${activityFiles.length} total run activities.`);

    const endTime = Date.now();
    const totalTimeMs = endTime - startTime;
    const totalTimeFormatted = new Date(totalTimeMs).toISOString().substr(11, 8);

    console.info(`Total time taken: ${totalTimeFormatted}.`);
}

// Run the main function if this script is executed directly
if (require.main === module) {
    main().catch(err => {
        console.error(`An error occurred: ${err.message}`);
        process.exit(1);
    });
}

module.exports = {
    main,
    parseActivityData,
    generateGpx,
    getActivitiesList,
    getActivityDetails
};
