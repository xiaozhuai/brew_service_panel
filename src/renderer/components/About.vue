<template>
    <div class="about">
        <div style="text-align: center;">{{packageInfo.productName}}</div>
        <div style="text-align: center; margin-bottom: 18px;">{{packageInfo.description}}</div>
        <ul>
            <li><span>Author</span>{{packageInfo.author}}</li>
            <li><span>Version</span>{{packageInfo.version}}</li>
            <li><span>License</span><ExternalLink :href="packageInfo.repository.license_url">{{packageInfo.license}}</ExternalLink></li>
            <li><span>Repository</span><ExternalLink :href="packageInfo.repository.url">{{packageInfo.repository.url}}</ExternalLink></li>
        </ul>
        <div style="margin-top: 18px; text-align: right;" v-loading="starsIsLoading">
            <el-button style="margin-right: 24px;" size="mini" type="text"
                       @click="checkForUpdates()"
                       :icon="isCheckingForUpdates ? 'el-icon-loading' : ''">
                {{isCheckingForUpdates ? 'Checking...' : 'Check for updates'}}
            </el-button>
            <el-badge style="margin-right: 24px;" :value="stars" class="item" :hidden="starsIsLoading || hideStars">
                <ExternalLinkButton :href="packageInfo.repository.url">Give me a star!</ExternalLinkButton>
            </el-badge>
        </div>
    </div>
</template>

<script>
    import ExternalLink from "@/components/ExternalLink";
    const {shell} = require('electron');
    import request from 'request';
    import packageInfo from "@/../../package.json";
    import * as compareVersions from 'compare-versions';
    import ExternalLinkButton from "@/components/ExternalLinkButton";

    export default {
        name: "About",
        components: {ExternalLinkButton, ExternalLink},
        data() {
            return {
                packageInfo,
                stars: 0,
                starsIsLoading: true,
                hideStars: false,
                isCheckingForUpdates: false,
            }
        },
        created() {
            this.refreshStars();
        },
        methods: {
            refreshStars() {
                this.starsIsLoading = true;

                request.get({
                    url: this.packageInfo.repository.api_url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                    }
                }, (err, response, body) => {
                    if (err) {
                        console.error(err);
                        this.hideStars = true;
                        this.starsIsLoading = false;
                        return;
                    }

                    if (response.statusCode !== 200) {
                        console.log('Get repository stars err, status code not 200');
                        this.hideStars = true;
                        this.starsIsLoading = false;
                        return;
                    }

                    // console.log(body);
                    let data = JSON.parse(body);
                    // console.log(data);
                    this.stars = data.stargazers_count;
                    this.starsIsLoading = false;
                    this.hideStars = false;

                });
            },
            checkForUpdates() {
                this.isCheckingForUpdates = true;
                request.get({
                    url: this.packageInfo.repository.release_api_url,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36'
                    }
                }, (err, response, body) => {
                    if (err) {
                        console.error(err);
                        this.isCheckingForUpdates = false;
                        return;
                    }

                    if (response.statusCode !== 200) {
                        console.error('Check for updates err, status code not 200');
                        this.isCheckingForUpdates = false;
                        return;
                    }

                    this.isCheckingForUpdates = false;

                    // console.log(body);
                    let data = JSON.parse(body);
                    // console.log(data);

                    let latest = data[0];

                    let curVer = this.packageInfo.version;
                    let latestVer = latest.tag_name;

                    console.log('latest:', latestVer, 'cur:', curVer);

                    if(compareVersions(latestVer, curVer) === 1){ //has updates
                        this.$confirm(`A new version ${latestVer} now is available, download now?`, 'Info', {
                            confirmButtonText: 'Yes',
                            cancelButtonText: 'No',
                            type: 'success'
                        }).then(() => {
                            let releaseUrl = `https://github.com/xiaozhuai/brew_service_panel/releases/tag/${latestVer}`;
                            shell.openExternal(releaseUrl);
                        }).catch(() => {
                            //do nothing
                        });
                    }else{
                        this.$alert(`Version ${curVer} you are currently using is up-to-date!`, 'Info', {
                            confirmButtonText: 'Got it!',
                            type: 'success'
                        });
                    }
                });
            },
        }
    }
</script>

<style scoped>
    div.about {
        color: #404040;
    }

    ul {
        margin: 0;
        padding: 0;
        color: #606060;
    }

    li > span {
        width: 96px;
        display: inline-block;
    }

    li > span:after {
        content: ' :';
    }

    li {
        list-style-type: none;
    }
</style>

