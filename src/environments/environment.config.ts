import { writeFile } from 'fs';
// Configure Angular `environment.ts` file path
const targetPath = './src/environments/environment.ts';
// Load node modules

require('dotenv').config();

// `environment.ts` file structure
const envConfigFile = `export const environment = {
    production: ${process.env.PRODUCTION},
    title: '${process.env.TITLE}',
    mcs_template: '${process.env.MCS_TEMPLATE}',
    main_url: '${process.env.MAIN_URL}',
    api_url: '${process.env.API_URL}',
    insight_api_url: '${process.env.INSIGHT_API_URL}',
    s3_image_url: '${process.env.S3_IMAGE_URL}',
    logo_title: '${process.env.LOGO_TITLE}',
    map_center_position: ${process.env.MAP_CENTER_POSITION},
    enable_insight: ${process.env.ENABLE_INSIGHT}
};
`;

console.log('The file `environment.ts` will be written with the following content: \n');
console.log(envConfigFile);
writeFile(targetPath, envConfigFile, function (err) {
    if (err) {
        throw console.error(err);
    } else {
        console.log(`Angular environment.ts file generated correctly at ${targetPath} \n`);
    }
});