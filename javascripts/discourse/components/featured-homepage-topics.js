import discourseComputed from "discourse-common/utils/decorators";
import Component from "@ember/component";
import { next } from "@ember/runloop";
import I18n from "I18n";
import { inject as service } from "@ember/service";
import Topic from "discourse/models/topic";
import { defaultHomepage } from "discourse/lib/utilities";

const FEATURED_CLASS = "featured-homepage-topics";

export default Component.extend({
  classNameBindings: ["featured-homepage-topics"],
  router: service("router"),
  isLoading: true,
  titleElement: null,
  featuredTagTopics: null,

  init() {
    this._super();
    this.set("isLoading", true);
    this._getBanner();
    this._checkClass();
  },

  _getBanner() {
    if (this.isDestroying || this.isDestroyed) {
      return;
    }
    let sortOrder = settings.sort_by_created ? "created" : "activity";

    this.store
      .findFiltered("topicList", {
        filter: settings.topic_source,
        params: {
          order: sortOrder,
        },
      })
      .then((topicList) => {
        let featuredTagTopics = [];
        topicList.topics.forEach((topic) => {
          featuredTagTopics.push(Topic.create(topic));
        });
        this.set(
          "featuredTagTopics",
          featuredTagTopics.slice(0, settings.number_of_topics)
        );
        next(this, () => this.set("isLoading", false));
      });
  },

  _checkClass() {
    if (!this.showHere) {
      document.querySelector("body").classList.remove(FEATURED_CLASS);
    }
  },

  didInsertElement() {
    this.appEvents.on("page:changed", this, "_checkClass");
  },

  willDestroyElement() {
    this.appEvents.off("page:changed", this, "_checkClass");
    document.querySelector("body").classList.remove(FEATURED_CLASS);
  },

  @discourseComputed(
    "site.mobileView",
    "router.currentRoute",
    "router.currentRouteName"
  )
  showHere(isMobile, currentRoute, currentRouteName) {
    if (isMobile && !settings.display_mobile) {
      return false;
    }
    let showHere;

    if (currentRoute) {
      if (settings.show_on === "homepage") {
        showHere = currentRouteName === `discovery.${defaultHomepage()}`;
      } else if (settings.show_on === "top_menu") {
        const topMenuRoutes = this.siteSettings.top_menu
          .split("|")
          .filter(Boolean);
        showHere = topMenuRoutes.includes(currentRoute.localName);
      } else if (settings.show_on === "all") {
        showHere =
          currentRouteName.indexOf("editCategory") &&
          currentRouteName.indexOf("admin") &&
          currentRouteName.indexOf("full-page-search");
      } else {
        return false;
      }
    }

    if (showHere) {
      document.querySelector("body").classList.add(FEATURED_CLASS);
    }

    return showHere;
  },

  @discourseComputed()
  showTitle() {
    if (settings.show_title) {
      const titleElement = document.createElement("h2");
      titleElement.innerHTML =
        I18n.t(themePrefix("featured_topic_title")) || settings.title_text;
      return titleElement;
    }
  },

  @discourseComputed()
  showFor() {
    if (
      settings.show_for === "everyone" ||
      (settings.show_for === "logged_out" && !this.currentUser) ||
      (settings.show_for === "logged_in" && this.currentUser)
    ) {
      return true;
    } else {
      return false;
    }
  },
});
