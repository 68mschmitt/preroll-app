// <Preferences MachineIdentifier="32d2a26b-b17e-4864-a9fe-fad55f817c56" ProcessedMachineIdentifier="4c187c840e1d1e7746bced982ecfdbf17140c13e" customConnections="http://192.168.1.185:3240
import { readFileSync, writeFileSync } from 'fs';

/**
 * Updates the CinemaTrailersPrerollID in Preferences.xml to a new value.
 * @param {string} xmlFilePath - Path to the Preferences.xml file.
 * @param {string} newPrerollID - The new CinemaTrailersPrerollID value.
 */
function updateCinemaTrailersPrerollID(xmlFilePath, newPrerollID) {
  try {
    // Read the XML file
    let xmlContent = readFileSync(xmlFilePath, 'utf-8');

    // Use regex to update the CinemaTrailersPrerollID
    const regex = /(CinemaTrailersPrerollID=")[^"]*(")/;
    if (!regex.test(xmlContent)) {
      throw new Error('CinemaTrailersPrerollID not found in Preferences.xml');
    }

    xmlContent = xmlContent.replace(regex, `$1${newPrerollID}$2`);

    // Write the updated content back to the file
    writeFileSync(xmlFilePath, xmlContent, 'utf-8');

    console.log('CinemaTrailersPrerollID successfully updated.');
  } catch (error) {
    console.error('Error updating CinemaTrailersPrerollID:', error.message);
  }
}

export default updateCinemaTrailersPrerollID;

