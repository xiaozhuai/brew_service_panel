<template>
    <div class="preference">


        <el-form ref="form" label-width="140px">
            <el-form-item label="Start at login">
                <el-switch @change="handleStartAtLogin"
                           v-model="startAtLogin"
                           active-color="#13ce66"
                           inactive-color="#ff4949"/>
            </el-form-item>
            <div style="color: #aaaaaa; margin-bottom: 18px; margin-left: 8px;">
                Followings will take effect after relaunch {{packageInfo.productName}}
            </div>
            <el-form-item label="Window size">
                <el-col :span="12">
                    <el-input-number @change="storeWindowConfig()"
                                     v-model="windowConfig.width"
                                     type="number" :min="600"/>
                </el-col>
                <el-col :span="12">
                    <el-input-number @change="storeWindowConfig()"
                                     v-model="windowConfig.height"
                                     type="number" :min="300"/>
                </el-col>
            </el-form-item>
            <el-form-item label="Horizontal margin">
                <el-input-number @change="storeWindowConfig()"
                                 v-model="windowConfig.horizontal_margin"
                                 type="number" :min="0"/>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
    import packageInfo from "@/../../package.json";
    import * as AutoLaunch from 'auto-launch';
    import persistence from "@/../libs/Persistence";

    const autoLaunchAppAtLogin = new AutoLaunch({
        name: packageInfo.productName
    });

    export default {
        name: "Preference",
        data() {
            return {
                packageInfo,
                startAtLogin: false,
                windowConfig: {},
            }
        },
        created() {
            this.windowConfig = persistence.get('window', {
                width: 600,
                height: 300,
                horizontal_margin: 6
            });
            this.checkStartAtLogin();
        },
        methods: {
            checkStartAtLogin() {
                autoLaunchAppAtLogin.isEnabled()
                    .then(enable => {
                        this.startAtLogin = enable;
                    });
            },
            handleStartAtLogin() {
                autoLaunchAppAtLogin.isEnabled()
                    .then(enable => {
                        if (enable === this.startAtLogin) return;

                        if (this.startAtLogin) {
                            autoLaunchAppAtLogin.enable();
                        } else {
                            autoLaunchAppAtLogin.disable();
                        }
                    })
                    .then(() => {
                        this.checkStartAtLogin();
                    });
            },
            storeWindowConfig() {
                persistence.set('window', this.windowConfig);
            },
        }
    }
</script>

<style scoped>

</style>
