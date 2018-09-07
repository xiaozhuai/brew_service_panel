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
                               v-model="scope.row.as_root"
                               @change="storeServiceMap()"
                               active-color="#13ce66" inactive-color="#ff7d7d"/>
                </template>
            </el-table-column>

            <el-table-column align="center" label="Auto Start" width="80">
                <template slot-scope="scope">
                    <el-switch :disabled="scope.row.status !== 'stopped'"
                               v-model="scope.row.auto_start"
                               @change="storeServiceMap()"
                               active-color="#13ce66" inactive-color="#ff7d7d"/>
                </template>
            </el-table-column>

            <el-table-column align="center" label="Operation" fixed="right" width="180">
                <template slot-scope="scope">
                    <el-button :disabled="['starting', 'restarting', 'stopping', 'started'].indexOf(scope.row.status) >= 0"
                               @click="handleStartService(scope.row, scope.$index)"
                               type="text">Start
                    </el-button>
                    <el-button :disabled="['starting', 'restarting', 'stopping'].indexOf(scope.row.status) >= 0"
                               @click="handleRestartService(scope.row, scope.$index)"
                               type="text">Restart
                    </el-button>
                    <el-button :disabled="['starting', 'restarting', 'stopping', 'stopped'].indexOf(scope.row.status) >= 0"
                               @click="handleStopService(scope.row, scope.$index)"
                               type="text">Stop
                    </el-button>
                    <el-button :disabled="scope.row.status !== 'started'"
                               @click="handleRevealInFinder(scope.row, scope.$index)"
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

                    for (let i = 0; i < list.length; i++) {
                        let item = list[i];
                        let name = item.name;

                        if (this.serviceMap.hasOwnProperty(name)) {
                            if(this.serviceMap[name].hasOwnProperty('as_root')){
                                list[i].as_root = this.serviceMap[name].as_root;
                            }else{
                                list[i].as_root = false;
                            }
                            if(this.serviceMap[name].hasOwnProperty('auto_start')){
                                list[i].auto_start = this.serviceMap[name].auto_start;
                            }else{
                                list[i].auto_start = false;
                            }
                        }else{
                            list[i].as_root = false;
                            list[i].auto_start = false;
                        }

                        if(item.status === 'started'){
                            if(item.user === 'root'){
                                list[i].as_root = true;
                            }

                            if(!item.plist.startsWith('/usr/local')){
                                list[i].auto_start = true;
                            }
                        }
                    }

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
                    case 'restarting':
                    case 'starting':
                    case 'stopping':
                        return 'info';
                    case 'error':
                        return 'danger';
                }
            },
            handleStartService(item, index) {
                brewServices.start(
                    item.name, item.as_root, item.auto_start,
                    status => {
                        this.setStatus(index, status);
                    },
                    (err, suc) => {
                        if(!suc) {
                            this.refreshList();
                            this.showError(err);
                        }
                    }
                );
            },
            handleRestartService(item, index) {
                brewServices.restart(
                    item.name, item.as_root, item.auto_start,
                    status => {
                        this.setStatus(index, status);
                    },
                    (err, suc) => {
                        if(!suc) {
                            this.refreshList();
                            this.showError(err);
                        }
                    }
                );
            },
            handleStopService(item, index) {
                brewServices.stop(
                    item.name, item.as_root,
                    status => {
                        this.setStatus(index, status);
                    },
                    (err, suc) => {
                        if(!suc) {
                            this.refreshList();
                            this.showError(err);
                        }
                    }
                );
            },
            handleRevealInFinder(item) {
                brewServices.revealPlistInFinder(item.name, err => {
                    this.showError(err);
                });
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

            storeServiceMap() {
                this.serviceMap = {};
                this.list.forEach(item => {
                    this.serviceMap[item.name] = {
                        as_root: item.as_root,
                        auto_start: item.auto_start,
                    };
                });
                console.log(this.serviceMap);
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
