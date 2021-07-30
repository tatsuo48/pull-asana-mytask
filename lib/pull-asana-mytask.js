"use babel";
import { CompositeDisposable } from "event-kit";
import { actions } from "inkdrop";
import axios from "axios";

const BASE_URL = "https://app.asana.com/api/1.0";
const NAMESPACE = "pull-asana-mytask";
const ENVS = {
  asana_token: "",
  asana_mytask_project_id: "",
  asana_pull_sections: "",
};

const getENV = () => {
  Object.keys(ENVS).forEach((name) => {
    ENVS[name] = inkdrop.config.get(`${NAMESPACE}.${name}`);
    if (!ENVS[name]) {
      inkdrop.notifications.addError(
        `${name} is not set. please set ${name}: Preferences > Plugins > pull-asana-mytask`,
        {
          dismissable: true,
        }
      );
      throw new Error(`${name} is not set`);
    }
  });
};

const getTaskBySection = async (sectionName) => {
  let { data } = await axios.get(
    `${BASE_URL}/projects/${ENVS["asana_mytask_project_id"]}/sections`,
    {
      headers: { Authorization: `Bearer ${ENVS["asana_token"]}` },
    }
  );
  let sectionGID = "";
  for (let section of data.data) {
    if (section.name === sectionName) {
      sectionGID = section.gid;
    }
  }
  const resp = await axios.get(`${BASE_URL}/sections/${sectionGID}/tasks`, {
    headers: { Authorization: `Bearer ${ENVS["asana_token"]}` },
  });
  const tasks = await Promise.all(
    resp.data.data.map(async (task) => {
      let { data } = await axios.get(`${BASE_URL}/tasks/${task.gid}/`, {
        headers: { Authorization: `Bearer ${ENVS["asana_token"]}` },
      });
      return { name: data.data.name, url: data.data.permalink_url };
    })
  );
  return tasks;
};

const converMarkdown = (section, tasks) => {
  let markdown = `## ${section}\n`;
  tasks.forEach((task) => {
    markdown += `- [ ] [${task.name}](${task.url})\n`;
  });
  return markdown;
};

const pull = async () => {
  getENV();
  const { editingNote } = inkdrop.store.getState();
  if (!editingNote) {
    throw new Error("editingNote is not found");
  }
  const { body } = editingNote;
  let markdown = "";
  for (const section of ENVS["asana_pull_sections"].split(",")) {
    const tasks = await getTaskBySection(section);
    markdown += converMarkdown(section, tasks);
  }
  inkdrop.store.dispatch(
    actions.editingNote.update({ body: body + "\n\n" + markdown })
  );
  inkdrop.store.dispatch(actions.editor.change(true));
};

module.exports = {
  config: {
    asana_token: {
      title: "Asana Personal Token",
      description:
        "Create Asana Personal Token https://asana.com/guide/help/api/api",
      type: "string",
    },
    asana_mytask_project_id: {
      title: "Asana MyTask Project ID",
      description:
        "Asana MyTask Project ID https://app.asana.com/0/{{ProjectID}}/list",
      type: "string",
    },
    asana_pull_sections: {
      title: "Asana Pull Sections",
      description:
        "Asana Pull Sections, it's comma separated values e.g. SectionA,SectionB,SectionC",
      type: "string",
    },
  },
  activate() {
    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
      inkdrop.commands.add(document.body, {
        "pull-asana-mytask:pull": () => pull(),
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },
};
