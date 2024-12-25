<script setup>

    import { useAppStore } from './stores/appStore';
    const app = useAppStore()  // Pinia store

    import { onMounted } from 'vue';
    import { dragAndDrop } from './modules/dragAndDropHandler';

    import Header from './components/Header.vue'
    import Footer from './components/Footer.vue'
    import UploadArea from './components/UploadArea.vue';
    import ActivityLog from './components/ActivityLog.vue';
    import StatusBox from './components/StatusBox.vue';
    import SettingsArea from './components/SettingsArea.vue';
    import DownloadArea from './components/DownloadArea.vue';


    import Tabs from 'primevue/tabs';
    import TabList from 'primevue/tablist';
    import Tab from 'primevue/tab';
    import TabPanels from 'primevue/tabpanels';
    import TabPanel from 'primevue/tabpanel';


    onMounted(() => {
        dragAndDrop((file) => {
            app.set('file', file)
            app.set('fileURL', URL.createObjectURL(file))
            app.set('currentTab', '1')
        });
    });

</script>

<template>
    <main>

        <Header></Header>

        <Tabs v-model:value="app.currentTab">
            <TabList>
                <Tab value="0">Start</Tab>
                <Tab value="1">Settings</Tab>
                <Tab value="2">Process</Tab>
                <Tab value="3">Output</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <UploadArea></UploadArea>
                </TabPanel>
                <TabPanel value="1">
                    <SettingsArea></SettingsArea>
                </TabPanel>
                <TabPanel value="2">
                    <ActivityLog></ActivityLog>
                    <StatusBox></StatusBox>
                </TabPanel>
                <TabPanel value="3">
                    <DownloadArea></DownloadArea>
                </TabPanel>
            </TabPanels>
        </Tabs>
        <Footer></Footer>


    </main>


</template>

<style>
    main {
        font-family: Avenir, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-align: center;
        color: #2c3e50;
        min-height: 100vh;
    }

</style>
