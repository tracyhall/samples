from tinycss.css21 import CSS21Parser

class CSSMediaQueryParser(CSS21Parser):
    NESTED_AT_RULES = ['@media', '@page', '@font-face', '@keyframes', '@supports', '@document']

    def parse_media(self, tokens):
        self.content = ''.join(value.as_css() for value in tokens)
        print self.content

    def parse_at_rule(self, rule, previous_rules, errors, context):
        if rule.at_keyword.strip() == '':
            return
        elif rule.at_keyword not in self.NESTED_AT_RULES:
            return GenericAtRule(rule.at_keyword, rule.head, rule.line, rule.column)
        else:
            if rule.at_keyword in ['@media', '@page']:
                body = self.parse_rules(rule.body, rule.at_keyword)[0]
            else:
                body = self.parse_declaration_list(rule.body)[0]
            return NestedRule(rule.at_keyword, rule.head, body, rule.line, rule.column)
            
        at_rule = super(CSSMediaQueryParser, self).parse_at_rule(rule, previous_rules, errors, context)
        return at_rule


class NestedRule(object):
    def __init__(self, at_keyword, tokens, rules, line, column):
        self.at_keyword = at_keyword
        self.content = tokens.as_css()
        self.rules = rules
        self.line = line
        self.column = column


    def __repr__(self):
        return ('<{0.__class__.__name__} {0.line}:{0.column}'
                ' {0.rules}>'.format(self))


class GenericAtRule(object):
    def __init__(self, at_keyword, tokens, line, column):
        self.at_keyword = at_keyword
        self.content = ''.join(value.as_css() for value in tokens)
        self.line = line
        self.column = column

    def __repr__(self):
        return ('<{0.__class__.__name__} {0.line}:{0.column}'
                ' {0.content}>'.format(self))

    def display(self):
        return ' '.join([self.at_keyword, self.content])
