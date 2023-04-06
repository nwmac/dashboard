<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import BusyButton from '@shell/components/BusyButton.vue';

export default {
  components: {
    BusyButton,
    Loading,
    LabeledInput,
    LabeledSelect,
  },
  mixins: [CreateEditView],

  async fetch() {
    // let cur = (this.value.decodedData.defaultRegion || '').toLowerCase();

    // if ( !cur ) {
    //   cur = this.$store.getters['aws/defaultRegion'];
    //   this.value.setData('defaultRegion', cur);
    // }

    // this.knownRegions = await this.$store.dispatch('aws/defaultRegions');

    // if ( !this.knownRegions.includes(cur) ) {
    //   this.knownRegions.unshift(cur);
    // }

  },

  data() {
    console.error('openstack');
    console.error(this);

    return {
      projects:     null,
      step:         1,
      busy:         false,
      knownRegions: null,
      project:      '',
    };
  },

  computed: {
    projectOptions() {
      const sorted = (this.projects || []).sort((a, b) => a.name.localeCompare(b.name));

      return sorted.map((p) => {
        return {
          label: p.name,
          value: p.id
        };
      });
    }
  },

  methods: {
    // Validate that we can get a token for the project that the user has selected
    async test() {
      this.value.openstackcredentialConfig.neil = 'heyheyhey!';

      this.value.annotations['openstack.cattle.io/username'] = this.value.decodedData.username;
      this.value.annotations['openstack.cattle.io/domainName'] = this.value.decodedData.domainName;
      this.value.annotations['openstack.cattle.io/endpoint'] = this.value.decodedData.endpoint;

      const project = this.projects.find(p => p.id === this.project);

      console.log(project);

      if (project) {
        this.value.annotations['openstack.cattle.io/projectName'] = project.name;
        this.value.annotations['openstack.cattle.io/projectId'] = project.id;
        this.value.annotations['openstack.cattle.io/projectDomainName'] = project.domain_id;
      }

      return true;
    },

    clear() {
      this.$set(this, 'step', 1);
      this.$set(this, 'projects', null);

      this.$emit('validationChanged', false);
    },

    async connect(cb) {
      console.error(this.value);

      const endpoint = this.value.decodedData.endpoint.replace(/^https?:\/\//, '');

      console.log(endpoint);

      this.$set(this, 'step', 2);
      this.$set(this, 'busy', true);

      const baseUrl = `/meta/proxy/${ endpoint }`;

      const url = `${ baseUrl }/auth/tokens`;

      const data = {
        auth: {
          identity: {
            methods: ['password'],
            password: {
              user: {
                name: this.value.decodedData.username,
                domain: {
                  name: this.value.decodedData.domainName
                },
                password: this.value.decodedData.password
              }
            }
          }
        }
      };

      console.log(url);

      const headers = { Accept: 'application/json' };

      // headers['x-api-auth-header'] = `Bearer NONE`;
      // headers['x-api-cattleauth-header'] = `Bearer credID=1 passwordField=accessToken`;

      try {
        const res = await this.$store.dispatch('management/request', {
          url,
          headers,
          method: 'POST',
          redirectUnauthorized: false,
          data
        }, { root: true });

        console.log(res);

        const token = res._headers['x-subject-token'];

        console.log(token);

        const userId = res?.token?.user?.id;

        console.log(userId);

        const authHeaders = {
          'x-api-auth-header': token,
          'X-Auth-Token': token
        };

        const res2 = await this.$store.dispatch('management/request', {
          url: `${ baseUrl }/users/${ userId }/projects`,
          headers: authHeaders,
          method: 'GET',
          redirectUnauthorized: false,
        }, { root: true });

        console.log(res2);

        if (res2?.projects) {
          this.$set(this, 'projects', res2.projects);
        }
      } catch (e) {
        console.error(e);
      }

      cb(true);

      this.$set(this, 'busy', false);
      this.$set(this, 'project', this.projectOptions[0]?.value);
      this.$emit('validationChanged', true);
    }
  }
};
</script>

<template>
  <Loading
    v-if="$fetchState.pending"
    :delayed="true"
  />
  <div v-else>
    <div class="row">
      <div class="col span-6">
      <LabeledInput
        :value="value.decodedData.endpoint"
        :disabled="step !== 1"
        label="Openstack Authentication URL"
        placeholder-key="cluster.credential.aws.accessKey.placeholder"
        type="text"
        :mode="mode"
        @input="value.setData('endpoint', $event);"
      />
      </div>
    <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.domainName"
          :disabled="step !== 1"
          label="Domain Name"
          placeholder-key="cluster.credential.aws.secretKey.placeholder"
          type="text"
          :mode="mode"
          @input="value.setData('domainName', $event);"
        />
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.username"
          :disabled="step !== 1"
          class="mt-20"
          label="Username"
          placeholder-key="cluster.credential.aws.secretKey.placeholder"
          type="text"
          :mode="mode"
          @input="value.setData('username', $event);"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          :value="value.decodedData.password"
          :disabled="step !== 1"
          class="mt-20"
          label="Password"
          placeholder-key="cluster.credential.aws.secretKey.placeholder"
          type="password"
          :mode="mode"
          @input="value.setData('password', $event);"
        />
      </div>
    </div>

    <BusyButton
      label="Authenticate"
      :disabled="step !== 1"
      class="mt-20"
      @click="connect"
    />

    <button
      class="btn role-primary mt-20 ml-20"
      :disabled="busy || step === 1"
      @click="clear"
    >Edit Auth Config</button>

    <div
      v-if="projects"
      class="row mt-20"
    >
      <div class="col span-6">
        <LabeledSelect
          v-model="project"
          label="Project"
          :options="projectOptions"
          :searchable="false"
        />
      </div>
    </div>
  </div>
</template>
