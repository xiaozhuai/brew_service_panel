<template>
    <div class="about">
        <div style="text-align: center;">{{packageInfo.productName}}</div>
        <div style="text-align: center; margin-bottom: 12px;">{{packageInfo.description}}</div>
        <ul>
            <li><span>Author</span>{{packageInfo.author}}</li>
            <li><span>Version</span>{{packageInfo.version}} <a @click="checkForUpdates()">check for updates</a></li>
            <li><span>License</span>{{packageInfo.license}}</li>
            <li><span>Repository</span><a @click="openRepository()">{{packageInfo.repository.url}}</a></li>
        </ul>
        <div style="margin-top: 12px; text-align: right;" v-loading="starsIsLoading">
            <span style="margin-right: 18px; line-height: 28px; display: inline-block;">Give me a star!</span>
            <el-badge style="margin-right: 48px;" :value="stars" class="item" :hidden="starsIsLoading || hideStars">
                <el-button size="mini" circle icon="el-icon-star-on" @click="openRepository()"></el-button>
            </el-badge>
        </div>
    </div>
</template>

<script>
    const {shell} = require('electron');
    import request from 'request';
    import packageInfo from "@/../../package.json";

    export default {
        name: "About",
        data() {
            return {
                packageInfo,
                stars: 0,
                starsIsLoading: true,
                hideStars: false,
            }
        },
        created() {
            this.refreshStars();
        },
        methods: {
            openRepository() {
                shell.openExternal(this.packageInfo.repository.url);
            },
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
                //todo
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

    a {
        cursor: pointer;
    }

    a:hover {
        color: teal;
    }
</style>

