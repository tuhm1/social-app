const inquirer = require('inquirer');
const { LocalUser, User } = require('./user');
const read = async (question, options = {}) => {
    const { value } = await inquirer.prompt([{ name: 'value', message: question, ...options }]);
    return value;
}
module.exports = async () => {
    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
        console.log('No admin found, creating one');
        const firstName = await read('First name?');
        const lastName = await read('Last name?');
        const username = await read('Username?');
        const readPassword = async () => {
            const password = await read('Password?', { type: 'password' });
            const password1 = await read('Confirm password?', { type: 'password' });
            if (password !== password1) {
                console.log('Password not match');
                return readPassword();
            }
            return password;
        }
        const password = await readPassword();
        await LocalUser.create({ firstName, lastName, username, password, isAdmin: true });
        console.log('Admin created');
    }
};