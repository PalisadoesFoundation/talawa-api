const path = require('path');
const display_about = require('./setup/Display_About');
const user_input = require('./setup/User_Input');
const start_application = require('./setup/Start_Application');

const run_setup = async() => {
    display_about();
    // await install_dependencies()
    await user_input(path.join(__dirname, '.env'));
    await start_application();
};

run_setup();