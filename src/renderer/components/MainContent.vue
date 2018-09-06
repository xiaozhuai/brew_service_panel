<template>
    <div id="brew-check-failed" v-if="!brewOk">
        <img id="brew-logo" src="../assets/homebrew.png"/>
        <div id="brew-check-failed-msg">
            You do not have homebrew installed, check <a @click="openHomebrewWebsite()">{{brewWebsiteUrl}}</a> for details, or <a @click="quit()">quit</a>.
        </div>
    </div>
    <div id="main-content" v-else-if="brewOk">

        <el-table id="service-list"
                  :data="list"
                  v-loading="listIsLoading"
                  empty-text="No homebrew service found"
                  stripe height="100">

            <!--<el-table-column align="center" label="Index">-->
            <!--<template slot-scope="scope">-->
            <!--{{scope.$index}}-->
            <!--</template>-->
            <!--</el-table-column>-->

            <el-table-column align="center" prop="name" label="Name"/>

            <el-table-column align="center" label="Status" width="80">
                <template slot-scope="scope">
                    <el-tag :type="statusType(scope.row.status)">{{scope.row.status.replace(/( |^)[a-z]/g, L => L.toUpperCase())}}
                    </el-tag>
                </template>
            </el-table-column>

            <el-table-column align="center" label="As Root" width="80">
                <template slot-scope="scope">
                    <el-switch :disabled="scope.row.status !== 'stopped'"
                               v-model="serviceMap[scope.row.name].as_root"
                               :change="storeServiceMap"
                               active-color="#13ce66" inactive-color="#ff7d7d"/>
                </template>
            </el-table-column>

            <el-table-column align="center" label="Auto Start" width="80">
                <template slot-scope="scope">
                    <el-switch :disabled="scope.row.status !== 'stopped'"
                               v-model="serviceMap[scope.row.name].auto_start"
                               :change="storeServiceMap"
                               active-color="#13ce66" inactive-color="#ff7d7d"/>
                </template>
            </el-table-column>

            <el-table-column align="center" label="Operation" fixed="right" width="180">
                <template slot-scope="scope">
                    <el-button :disabled="['starting', 'stopping', 'started'].indexOf(scope.row.status) >= 0"
                               @click="handleStartService(scope.$index)"
                               type="text">Start
                    </el-button>
                    <el-button :disabled="['starting', 'stopping'].indexOf(scope.row.status) >= 0"
                               @click="handleRestartService(scope.$index)"
                               type="text">Restart
                    </el-button>
                    <el-button :disabled="['starting', 'stopping', 'stopped'].indexOf(scope.row.status) >= 0"
                               @click="handleStopService(scope.$index)"
                               type="text">Stop
                    </el-button>
                    <el-button :disabled="scope.row.status !== 'started'"
                               @click="handleRevealInFinder(scope.$index)"
                               type="text">Plist
                    </el-button>
                </template>
            </el-table-column>
        </el-table>

        <div id="btn-container">
            <el-button @click="refreshList()"
                       :icon="listIsLoading ? 'el-icon-loading' : 'el-icon-refresh'"
                       :disabled="listIsLoading"
                       size="mini" circle></el-button>

            <el-button @click="quit()"
                       icon="el-icon-circle-close"
                       size="mini" circle style="float: right;"></el-button>

            <el-popover placement="top-start" width="440" trigger="click" style="float: right;">
                <About/>
                <el-button icon="el-icon-info" size="mini" circle style="float: right;" slot="reference"></el-button>
            </el-popover>

            <el-popover placement="top-start" width="440" trigger="click" style="float: right;">
                <Preference/>
                <el-button icon="el-icon-setting" size="mini" circle slot="reference"></el-button>
            </el-popover>
        </div>
    </div>
</template>

<script>
    import About from "@/components/About";
    import Preference from "@/components/Preference";
    const {ipcRenderer, shell} = require('electron');
    import brewServices from "@/../libs/BrewServices";
    import persistence from "@/../libs/Persistence";

    export default {
        name: "MainContent",
        components: {Preference, About},
        data() {
            return {
                brewWebsiteUrl: 'https://brew.sh/',
                brewOk: true,
                list: [],
                listIsLoading: true,
                serviceMap: {},
            }
        },
        watch: {
            serviceMap: {
                handler(newVal, oldVal){
                    console.log(newVal);
                },
                deep: true
            },
            list: {
                handler(newVal, oldVal){
                    console.log(newVal);
                },
                deep: true
            }
        },
        created() {
            this.checkHomebrew();
            this.serviceMap = persistence.get('service_map', {});
            console.log(`service_map: ${JSON.stringify(this.serviceMap, null, 4)}`);
            this.refreshList();
            ipcRenderer.on('refresh-list', () => {
                this.refreshList();
            });
        },
        methods: {

            checkHomebrew() {
                brewServices.checkHomebrew(ok => {
                    this.brewOk = ok;
                });
            },

            openHomebrewWebsite() {
                shell.openExternal(this.brewWebsiteUrl);
            },

            refreshList() {
                this.listIsLoading = true;
                brewServices.getList((err, list) => {
                    if (err) {
                        this.showError(err);
                        this.listIsLoading = false;
                        return;
                    }

                    list.forEach(item => {
                        if (!this.serviceMap.hasOwnProperty(item.name)) {
                            this.serviceMap[item.name] = {
                                as_root: false,
                                auto_start: false,
                            };
                        }

                        if(item.status === 'started'){
                            if(item.user === 'root'){
                                this.setAsRoot(item.name, true);
                            }

                            if(!item.plist.startsWith('/usr/local')){
                                this.setAutoStart(item.name, true);
                            }
                        }

                        if(!this.serviceMap[item.name].hasOwnProperty('as_root')){
                            this.setAsRoot(item.name, false);
                        }

                        if(!this.serviceMap[item.name].hasOwnProperty('auto_start')){
                            this.setAutoStart(item.name, false);
                        }
                    });
                    this.storeServiceMap();


                    this.list = list;
                    this.listIsLoading = false;
                });
            },

            statusType(status) {
                switch (status) {
                    case 'started':
                        return 'success';
                    case 'stopped':
                        return 'warning';
                    case 'starting':
                    case 'stopping':
                        return 'info';
                    case 'error':
                        return 'danger';
                }
            },
            handleStartService(index) {
                let item = this.list[index];
                let as_root = this.serviceMap[item.name].as_root;
                let auto_start = this.serviceMap[item.name].auto_start;

                brewServices.start(
                    item.name, as_root, auto_start,
                    status => {
                        this.setStatus(index, status);
                    },
                    (err, suc) => {
                        if(!suc) {
                            this.showError(err);
                        }
                    }
                );
            },
            handleRestartService(index) {
                let item = this.list[index];
                let as_root = this.serviceMap[item.name].as_root;
                let auto_start = this.serviceMap[item.name].auto_start;

                brewServices.restart(
                    item.name, as_root, auto_start,
                    status => {
                        this.setStatus(index, status);
                    },
                    (err, suc) => {
                        if(!suc) {
                            this.showError(err);
                        }
                    }
                );
            },
            handleStopService(index) {
                let item = this.list[index];
                let as_root = this.serviceMap[item.name].as_root;

                brewServices.stop(
                    item.name, as_root,
                    status => {
                        this.setStatus(index, status);
                    },
                    (err, suc) => {
                        if(!suc) {
                            this.showError(err);
                        }
                    }
                );
            },
            handleRevealInFinder(index) {
                let plist = this.list[index].plist;
                if(plist === '') return;
                brewServices.revealPlistInFinder(plist);
            },

            setAsRoot(name, enable) {
                this.serviceMap[name].as_root = enable;
            },

            setAutoStart(name, enable) {
                this.serviceMap[name].auto_start = enable;
            },

            setStatus(index, status) {
                this.list[index].status = status;
            },

            showError(err) {
                console.error(err);
                this.$message({
                    showClose: true,
                    type: 'error',
                    dangerouslyUseHTMLString: true,
                    message: `${err.stack}` //`<pre style="max-width: 300px; overflow: auto;">${err.stack}</pre>`
                });
            },

            storeServiceMap(obj1) {
                console.log('map changed');
                console.log(obj1);
                persistence.set('service_map', this.serviceMap);
            },

            quit() {
                this.$confirm('Do you want to quit BrewServicePanel?', 'Info', {
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                    type: 'warning'
                }).then(() => {
                    console.log('ipcRender send quit-app');
                    ipcRenderer.send('quit-app');
                }).catch(() => {
                    // cancel
                });
            },
        }
    }
</script>

<style lang="scss">
    $main-content-border-radius: 6px;
    $btn-container-horizontal-padding: 6px;

    #main-content {
        width: 100%;
        height: 100%;
    }

    #service-list {
        width: 100% !important;
        height: calc(100% - #{28px + 2*$btn-container-horizontal-padding}) !important;
        border-top-left-radius: $main-content-border-radius;
        border-top-right-radius: $main-content-border-radius;
    }

    #btn-container {
        background: white;
        padding: $btn-container-horizontal-padding 12px;
        border-bottom-left-radius: $main-content-border-radius;
        border-bottom-right-radius: $main-content-border-radius;
    }

    #btn-container > * + * {
        margin-left: 8px;
    }

    .el-table .cell {
        padding-left: 0 !important;
        padding-right: 0 !important;
    }

    .cell .el-switch {
        vertical-align: top;
        top: 1px;
    }

    #brew-check-failed {
        border-radius: $main-content-border-radius;
        background-color: white;
        width: 100%;
        height: 100%;
        text-align: center;
    }

    #brew-logo {
        padding-top: 40px;
        height: 100px;
    }

    #brew-check-failed-msg {
        text-align: center;
        padding-top: 24px;
    }

    .cell .el-button--mini {
        padding: 3px 0 !important;
    }
</style>

<style scoped>
    a {
        cursor: pointer;
    }

    a:hover {
        color: teal;
    }
</style>
