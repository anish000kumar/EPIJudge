// [ ] CSS
// [ ] Drop-down animation
// [x] Cookies
// [x] Togglable languages
// [ ] links
const EPI_DATA = translateProblemMappings(problem_mapping);


const ALL_LANGUAGES = ['python', 'cpp', 'java'];

Vue.component('donut', {
    props: ['x', 'size', 'width', 'rad', 'lineWidth', 'font'],
    template: `
          <canvas id="canvas" class="centered" 
                            :width=width :height=size :rad=rad 
                            :lineWidth=lineWidth :font=font>
        </canvas>
      `,
    methods: {
        "paint": function () {
            drawArk(this.$el, this.x);
        }
    },
    watch: {
        x: function (val, oldVal) {
            this.paint();
        }
    },
    mounted: function () {
        this.paint();
    }
})

Vue.component('chapter-donut', {
    props: ['x'],
    template: `<div class="chapter-bar"> <div :style="{width: x*100+'%'}" class="chapter-inner-bar"></div> </div>`
})

// Vue.component('chapter-donut', {
//     props: ['x'],
//     template: `<donut :x=x size=80 width=100 rad=35 lineWidth=7 font='13px Roboto'> </donut>`
// })

Vue.component('score-donut', {
    props: ['x'],
    template: `<donut :x=x size=36 width=70 rad=14 lineWidth=4></donut>`
})

Vue.component('problem-donut', {
    props: ['x'],
    template: `<div class="problem-bar"> <div :style="{width: x*100+'%'}" class="chapter-inner-bar"></div> </div>`
})

Vue.component('problem-plot', {
    props: ['data', 'extended', 'lang'],
    template: `
      <div class="problem-plot">
        <problem-donut align=center :x=(data.passed/data.total)>
        </problem-donut>
        <p> {{data.passed}}/{{data.total}} </p>
      </div>
      `
})

Vue.component('chapter-plot', {
    props: ['lang', 'data', 'extended'],
    template: `
      <div class="chapter-plot">
        <chapter-donut 
          :x=(data[lang]/data.total)>
        </chapter-donut>
      </div>
      `
})

Vue.component('problem-card', {
    props: ['problem'],
    computed: {
        'opened': function () {
            return this.$parent.selected_problem === this.problem.name;
        }
    },
    data() {
        return {
            hover: false,
            workspace_path: window.workspace_path
        };
    },
    methods: {
        toggle: function () {
            if (this.opened) {
                this.$parent.selected_problem = null;
            } else {
                this.$parent.selected_problem = this.problem.name;
            }
        }
    },
    template: `
        <a class="simple-link" :href="'vscode://file/'+workspace_path+'/'+problem[this.$root.langs[0]].filename.split('/')[1]">
          <div class="problem-card-wide mdl-card mdl-shadow--2dp" @mouseover="hover = true" @mouseleave="hover = false">
            <div class="problem-card-content mdl-card__supporting-text">
              <span class="problem-name">{{problem.name}}</span>
              <problem-plot v-for="l in this.$root.langs" 
                            :data=problem[l] :extended="hover" :lang=l>
              </problem-plot>
            </div>
          </div>
          </a>
      `
});

Vue.component('chapter-card', {
    props: ['chapter'],
    data: function () {
        return {selected_problem: null}
    },
    computed: {
        'opened': function () {
            return this.$root.selected_chapter && this.$root.selected_chapter.name === this.chapter.name;
        }
    },
    methods: {
        toggle: function () {
                this.$root.selected_chapter = this.chapter;
        }
    },
    template: `
        <div>
          <div class="chapter-card-wide mdl-card mdl-shadow--2dp" :class="{'selected-chapter': opened}" v-on:click="toggle">
            <div class="mdl-card__title">
              <h2 class="mdl-card__title-text">{{chapter.name}}</h2>
            </div>
            <div class="mdl-card__supporting-text">
              <chapter-plot v-for="l in this.$root.langs" 
                      :lang=l :data=chapter.progress :extended=true>
              </chapter-plot>
            </div>
          </div>
          
        </div>
    `
})

Vue.component('lang-enabler', {
    props: ['lang'],
    computed: {
        'enabled': function () {
            return this.$root.langs_enabled[this.lang];
        },
        'state_name': function () {
            if (this.enabled) {
                return 'checked';
            } else {
                return '';
            }
        },
        'label_id': function () {
            return "switch-label-" + this.lang;
        },
        'switch_id': function () {
            return "switch-" + this.lang;
        }

    },
    methods: {
        'toggle': function () {
            if (!this.enabled) {
                this.$root.langs_enabled[this.lang] = true;
            } else if (this.$root.langs.length > 1) {
                this.$root.langs_enabled[this.lang] = false;
            }
        }
    },
    template: `<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect"
                       :id="label_id" :for="switch_id" :checked="toggle">
            <input type="checkbox" :id="switch_id" class="mdl-switch__input">
            <span class="mdl-switch__label">{{$root.langs_displayname[lang]}}</span>
        </label>
    `
});


const epi = new Vue({
    el: '#epijudge-app',
    data: function () {
        return {
            chapters: EPI_DATA,
            selected_chapter: null,
            all_langs: ALL_LANGUAGES,
            langs_enabled: {"cpp": false, "java": false, "python": true},
            langs_displayname: {"cpp": "C++", "java": "Java", "python": "Python"}
        }
    },
    computed: {
        langs: function () {
            return this.all_langs.filter(e => this.langs_enabled[e]);
        },
        progress() {
            const result = {
                total: 0,
                progress: {}
            }
            this.chapters.forEach(chapter => {
                result.total += chapter.problems.length;
                Object.entries(chapter.progress).forEach(([language, solved]) => {
                    if(result.progress[language]){
                        result.progress[language] += solved
                    }
                    else {
                        result.progress[language] = solved
                    }
                })
            })
            return { total: result.total, solved: result.progress[this.langs[0]]}
        }
    },
    methods: {
        onLangSelect(e){
            const selected_lang = e.target.value;
            this.langs_enabled[this.langs[0]]=false;
            this.langs_enabled[selected_lang] = true;
        }
    },
    mounted: function () {
        const l = safeStorageGet("langs_enabled");
        if (l) {
            this.langs_enabled = l;
        }
        const ch = safeStorageGet("selected_chapter");
        if (ch) {
            this.selected_chapter = ch;
        }
    },
    watch: {
        langs_enabled: {
            handler: function (value) {
                window.localStorage["langs_enabled"] = JSON.stringify(value);
            },
            deep: true
        },
        selected_chapter: {
            handler: function (value) {
                window.localStorage["selected_chapter"] = JSON.stringify(value);
            },
            deep: true
        }
    }
});

function safeStorageGet(key) {
    const str = window.localStorage[key];
    if (str) {
        try {
            return JSON.parse(str);
        } catch (e) {
        }
    }
    return undefined;
}

function getColor(x) {
    if (x === 1) {
        return '#558b2f';
    }
    if (x > 0.7) {
        return '#99d066';
    }
    return '#ffd740';
}

function drawArk(el, x) {
    let p = -0.5 + 2 * x;
    const w = el.width;
    const h = el.height;
    let rad = el.getAttribute("rad");
    let ctx = el.getContext("2d");

    ctx.clearRect(0, 0, el.width, el.height);
    ctx.lineWidth = el.getAttribute("lineWidth");
    if (x > 0) {
        ctx.beginPath();
        ctx.strokeStyle = getColor(x);
        ctx.arc(w / 2, h / 2, rad, -0.5 * Math.PI, p * Math.PI, false);
        ctx.stroke();
    }
    if (x < 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#eaeaea';
        ctx.arc(w / 2, h / 2, rad, p * Math.PI, 1.5 * Math.PI, false);
        ctx.stroke();
    }

    if (el.getAttribute("font")) {
        ctx.font = el.getAttribute("font");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round(x * 100) + " %", w / 2, h / 2 + 2);
    }
}