import Module from "module"

export const resolveModulePath = (mname) => {
    const fakeParent = new Module('', null);
    fakeParent.paths = Module._nodeModulePaths(process.cwd());
    const moduleEntry = Module._resolveFilename(mname, fakeParent);
    const pname = '/node_modules/' + mname + "/";
    return moduleEntry.substring(0, moduleEntry.lastIndexOf(pname) + 14);
}