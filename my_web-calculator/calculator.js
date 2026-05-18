const PRECEDENCE = { "+": 2, "-": 2, "*": 4, "/": 4 };
const OPERATORS = ['+', '-', '/', '*', '='];

function getOperand(equation, pos) {
    let num = "";
    let moreDigits = true;
    
    while (moreDigits && pos < equation.length) {
        // regex check for numbers
        if (/[0-9]/.test(equation[pos])) {
            num += equation[pos];
            pos++;
        } else {
            moreDigits = false;
        }
    }
    
    if (num === "") {
        return { num: null, pos: pos };
    } else {
        return { num: parseInt(num), pos: pos };
    }
}

export function rpnConverter(equationString) {
    let pos = 0;
    let operators = [];
    let rpn = [];
    
    // first operand
    let result = getOperand(equationString, pos);
    
    // ensure string not empty (impossible but still good practice)
    if (result.num === null) return rpn; 
    
    rpn.push(result.num.toString());
    pos = result.pos; // 'pos' now points to first operator
    
    // loop through the rest of the equation
    while (pos < equationString.length) {
        
        let currentOperator = equationString[pos];
        // handle operator precedence (shunting yard logic)
        while (operators.length > 0 && PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[currentOperator]) {
            rpn.push(operators.pop());
        }
        operators.push(currentOperator);
        
        // step over to next operand
        pos++;
        if (pos < equationString.length) {
            result = getOperand(equationString, pos);
            if (result.num !== null) {
                rpn.push(result.num.toString());
            }
            pos = result.pos; // pos points to the next operator
        }
    }
    
    // end of string, get remaining operators from  stack
    while (operators.length > 0) {
        rpn.push(operators.pop());
    }
    
    return rpn;
}

export function evaluateRpn(rpn) {
    let stack = [];
    
    while (rpn.length > 0) {
        // wait until we hit an operator
        while (rpn.length > 0 && !["+", "-", "*", "/"].includes(rpn[0])) {
            stack.push(rpn.shift());
        }
        
        if (rpn.length === 0) break; // end of expr
        
        let num2 = parseFloat(stack.pop());
        let num1 = parseFloat(stack.pop());
        let result = 0.0;
        
        let operator = rpn.shift();
        
        if (operator === "+") {
            result = num1 + num2;
        } else if (operator === "-") {
            result = num1 - num2;
        } else if (operator === "*") {
            result = num1 * num2;
        } else if (operator === "/" && num2 !== 0) {
            result = num1 / num2;
        }
        
        stack.push(result.toString());
    }
    
    let finalAnswer = parseFloat(stack[0]);
    if (finalAnswer % 1 === 0) {
        return Math.floor(finalAnswer);
    }
    return finalAnswer;
}