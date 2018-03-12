const babel = require("babel-core");
const prettier = require("prettier");

const result = prettier.format(
  babel.transform(
    `import h from 'react-hyperscript'

const StatelessComponent = (props) => h('h1')

const StatelessWithReturn = (props) => {
  return h('.class', { shouldRender: lol.length > 0 })
}  

function named(props) {
  return h('h1')
}


class Comp extends React.Component {
  render() {
    return h("div.example", [
      h('h1#heading', {...getProps, ...getKnobs(), stuff: ''}),
      h('h1#heading', getChildren(), [h('div')]),
      h("div", [h("div", "Some content")]),
      h("h1#heading", "This is hyperscript"),
      h("h2", "creating React.js markup"),
      h(AnotherComponent, { foo: "bar", bar: () => ({}), shouldRender: thing.length > 0 }, [
        h("li", [h("a", { href: "http://whatever.com" }, "One list item")]),
        h("li", "Another list item")
      ])
    ]);
  }
}
`,
    {
      plugins: [
        [
          "./src/index.js",
          { revolut: true }
          // require("babel-plugin-syntax-async-generators"),
          // require("babel-plugin-syntax-class-properties"),
          // require("babel-plugin-syntax-decorators"),
          // require("babel-plugin-syntax-do-expressions"),
          // require("babel-plugin-syntax-dynamic-import"),
          // require("babel-plugin-syntax-flow"),
          // require("babel-plugin-syntax-function-bind"),
          // require("babel-plugin-syntax-function-sent"),
          // require("babel-plugin-syntax-jsx"),
          // require("babel-plugin-syntax-object-rest-spread")
        ],
        "syntax-async-generators",
        "syntax-class-properties",
        "syntax-decorators",
        "syntax-do-expressions",
        "syntax-dynamic-import",
        "syntax-flow",
        "syntax-function-bind",
        "syntax-function-sent",
        "syntax-jsx",
        "syntax-object-rest-spread"
      ]
    }
  ).code,
  { semi: false, singleQuote: true }
);

console.log(result);
