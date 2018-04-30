#!/usr/bin/env node
/* eslint no-var: 0 */

const babylon = require("babylon");
const fs      = require("fs");

const filename = process.argv[2];
if (!filename) {
  console.error("no filename specified");
  process.exit(0);
}

const file = fs.readFileSync(filename, "utf8");
const options = {
  sourceType: 'module',
  plugins: ['flow', 'jsx', 'classProperties', 'objectRestSpread' ],
};

console.log('parsing file:', filename);
var ast  = babylon.parse(file, options);






const walk = require('babylon-walk');
const util = require('util');


const fullWordSet = new Set();

runIt(ast);
console.log('')
console.log('');

const arr = Array.from(fullWordSet).filter(s => {
	return  ( s.charAt(0) !== '#'
				&& s.charAt(0) !== '%'
				&& s.charAt(0) !== '/'
				&& !s.endsWith('px')
				&& !s.endsWith('em')
			);
}).sort();
const formatedRes = arr.reduce((acc, val) => {
	acc[val] = val;
	return acc;
}, {});
console.log(JSON.stringify(formatedRes, null, '\t'));

function runIt(ast) {
	const jsxTextNodes = [];
	const stringLiterals = [];


	const state = {};


	const knownIgnoreStrings = {
		'easeInOut': true,
		'small': true,
		'_blank': true,
		'noopener noreferrer': true,
		'primary': true,
		'secondary': true,
		'slideUp': true,
		'slideDown': true,
		'insertHTML': true,
		'xs': true,
		'mousemove': true,
		'keydown': true,
		'wheel': true,
		'DOMMouseScroll': true,
		'mouseWheel': true,
		'mousedown': true,
		'touchstart': true,
		'touchmove': true,
		'MSPointerDown': true,
		'MSPointerMove': true,
		'tabindex': true,
		'text/plain': true,
		'topRight': true,
		'transition.bounceLeftOut': true,
		'transition.fadeOut': true,
		'uiStateMap': true,
		'bottom': true,
		'top': true,
		'conversationUIStateMap': true,
		'uiStateMap': true,
		'radio': true,

	}


	function looksLikeAClassName(str) {
		return (/^[a-z\-]+$/.test(str.trim()) && str.indexOf('-') > -1);
	}

	
	function shouldIgnoreParentTypeForStringLiteral(node, ancestors) {
		//console.log(ancestors)
		if(!ancestors) {
			console.log('no ancestors');
			return false;
		}
		const foundLegitParent = false;
		const startingSearchIndex = ancestors.length -2;
		const parent = ancestors[startingSearchIndex];
		const parentName = (parent.name && parent.name.name) || '';
		
		if(looksLikeAClassName(node.value.trim())) {
			// console.log('ignoring (most likely) classname', node.value.trim());
			return true;
		}
		if(knownIgnoreStrings[node.value.trim()]) {
			return true;
		}


		
		if(parent.type === 'ArrayExpression') {
			const grandParent = ancestors[ancestors.length - 3];
			if(grandParent.type === 'CallExpression') {
                                
				if (grandParent && grandParent.callee && grandParent.callee.property ) {
					const ret =  grandParent.callee.property.name === 'getIn' ||
						grandParent.callee.property.name === 'setIn'

					console.log('skipping getIn calls', ret)
					if(ret) return true;
				}	
				
			}
		}

		if(parent.type === 'CallExpression') {
			// console.log('parent', parent)
			if(parent.callee && parent.callee.object && parent.callee.object && parent.callee.object.name === 'console') {
				console.log('skipping console call');
				return true;
			}
			if(parent.callee && parent.callee.name  && parent.callee.name === 'translate') {
				console.log('skipping existing translate call');
				return true;
			}
		}

		switch (parent.type){
			
			case 'JSXAttribute':
			case 'Identifier':
			case 'JSXIdentifier':
				return parentName === 'className' || 
					parentName === 'href' ||
					parentName === 'ref' ||
					parentName === 'iconClassName';
			case 'ImportDeclaration':
				return true;
			case 'ClassProperty':
				return parent.key.name === 'displayName';
			case 'CallExpression':
				return parent.callee.name === 'classnames';
			default:
				return false;
		}

	}


	const visitors = {

		StringLiteral(node, state, ancestors) {
			// console.log("");
			// if(node.value.trim() === 'CrmRecordFormSelect _onChange expected an HTMLSelectElement with an HTMLOptionElement at selectedIndex, but did not find one') {
				
			// 	debugger;
			// 	console.log('wofhwpfehwp9fhwpfhewph*@#()@(#)@(#)@(@#)(#@)(@#)(')
			// }
	//		console.log('StringLiteral', node, state, ancestors);
			if(shouldIgnoreParentTypeForStringLiteral(node, ancestors)) {
	//			console.log(' ******** skipping  entry');
			}else {
				const val =node.value.trim();
				if(val) {
					console.log('adding string literal to fullWordSet', val)
					fullWordSet.add(val);
					stringLiterals.push(`${node.loc.start.line}:${node.loc.start.column} -- ${val}`)
				}
				// console.log('StringLiteral :"', node.value, '"')
			}
			
		},
		JSXText(node, state, ancestors) {
			const val = '' + (node.value || '').replace('\\n', '').replace('\\t', '').trim();
			if(val) {
				fullWordSet.add(val);
				jsxTextNodes.push(`${node.loc.start.line}:${node.loc.start.column} -- ${val}`);
			}
		}

	};


	walk.ancestor(ast, visitors, state);

	console.log('JSXText nodes', jsxTextNodes);
	console.log('');
	console.log('String Literals', stringLiterals);
}
