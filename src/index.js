"use strict";

const t = require("babel-core").types;
const getTagAndClassNamesAndId = require("./utils").getTagAndClassNamesAndId;

// utility functions that starts with b means build.

let isHyperscriptInScope = false;

const bJsxAttr = (prop, expressionOrValue) => {
  const stringOrExpression = t.isStringLiteral(expressionOrValue)
    ? expressionOrValue
    : t.JSXExpressionContainer(expressionOrValue);
  return t.JSXAttribute(bJsxIdent(prop.name), stringOrExpression);
};

const bJsxAttributes = objectExpression => {
  return objectExpression.properties.map((node) => {
      const { key, value, argument } = node
      if(t.isSpreadProperty(node)) {
        return t.JSXSpreadAttribute(argument)
      }
      else {
        return bJsxAttr(key, value)
      }
    }
  );
};

const bJsxOpenElem = ({ name, selfClosing = false, attributes = [] }) =>
  t.JSXOpeningElement(bJsxIdent(name), attributes, selfClosing);

const bJsxIdent = name => t.JSXIdentifier(name);

const bJsxCloseElem = name => t.JSXClosingElement(bJsxIdent(name));

// Builds self closed element
const bJsxElem = ({
  name,
  attributes = [],
  children = [],
  selfClosing = false
}) =>
  t.JSXElement(
    bJsxOpenElem({ attributes, name, selfClosing }),
    selfClosing ? bJsxCloseElem(name) : null,
    children,
    selfClosing
  );

// Makes component wrap around his children, so closes it around strings/JSXElements/expressions.
const closeComponent = (jsxElem, children) => {
  jsxElem.selfClosing = false;
  jsxElem.openingElement.selfClosing = false;
  jsxElem.closingElement = bJsxCloseElem(jsxElem.openingElement.name.name);
  jsxElem.children = children;
  return jsxElem;
};

const injectChildren = (jsxElem, node) => {
  if (t.isArrayExpression(node)) {
    return closeComponent(jsxElem, transformChildrenArray(jsxElem, node));
  }
  if (t.isStringLiteral(node)) {
    return closeComponent(jsxElem, [t.JSXText(node.value)]);
  }
  if (t.isExpression(node)) {
    return closeComponent(jsxElem, [t.JSXExpressionContainer(node)]);
  }
};

const transformChildrenArray = (jsxElem, node) => {
  return node.elements.map(element => {
    if (t.isCallExpression(element)) {
      return transformHyperscriptToJsx(element);
    }
    if (t.isStringLiteral(element)) {
      return t.JSXText(element.value);
    }
    if (t.isExpression(element)) {
      return t.JSXExpressionContainer(element);
    }
  });
};

const transformHyperscriptToJsx = node => {
  const [firstArg, secondArg, thirdArg] = node.arguments;
  switch (node.arguments.length) {
    case 1:
      return singleArgumentCase(firstArg);
    case 2:
      return twoArgumentsCase(firstArg, secondArg, true);
    case 3:
      return threeArgumentsCase(firstArg, secondArg, thirdArg);
    default:
      break;
  }
};

const singleArgumentCase = firstArgument => {
  const isElement = t.isStringLiteral(firstArgument);
  const isReactComponent = t.isIdentifier(firstArgument);
  let tagOrComponent = "";
  let attributes = [];
  if (isElement) {
    const { id, className, tag } = getTagAndClassNamesAndId(
      firstArgument.value
    );
    className &&
      attributes.push(
        bJsxAttr(t.JSXIdentifier("className"), t.StringLiteral(className))
      );
    id && attributes.push(bJsxAttr(t.JSXIdentifier("id"), t.StringLiteral(id)));
    return bJsxElem({
      selfClosing: true,
      name: tag,
      attributes
    });
  } else if (isReactComponent) {
    tagOrComponent = firstArgument.name;
    return bJsxElem({
      selfClosing: true,
      name: tagOrComponent
    });
  }
};

const twoArgumentsCase = (firstArg, secondArg, thirdArgIsAbsent) => {
  const jsxElem = singleArgumentCase(firstArg);
  const isPropsObject = t.isObjectExpression(secondArg);
  if (isPropsObject) {
    const props = bJsxAttributes(secondArg);
    const currentProps = jsxElem.openingElement.attributes;
    jsxElem.openingElement.attributes = [...currentProps, ...props];
    return jsxElem;
  }
  if (thirdArgIsAbsent) {
    return injectChildren(jsxElem, secondArg);
  } else {
    jsxElem.openingElement.attributes.push(t.JSXSpreadAttribute(secondArg))
    return jsxElem
  }
};

const threeArgumentsCase = (firstArg, secondArg, thirdArg) => {
  const jsxElem = twoArgumentsCase(firstArg, secondArg, false);
  return injectChildren(jsxElem, thirdArg);
};

module.exports = function() {
  return {
    visitor: {
      ImportDeclaration(path) {
        isHyperscriptInScope = t.isStringLiteral(path.node.source, {
          value: "react-hyperscript"
        });
        if (!isHyperscriptInScope) {
          return;
        }
      },
      CallExpression(path) {
        const { node } = path;
        const isHyperscriptCall = t.isIdentifier(node.callee, {
          name: "h"
        });
        const isTopLevelCall =
          t.isReturnStatement(path.container) ||
          t.isArrowFunctionExpression(path.container);
        if (isHyperscriptCall && isTopLevelCall) {
          let result = node;
          result = transformHyperscriptToJsx(node);
          path.replaceWith(result);
        }
      }
    }
  };
};