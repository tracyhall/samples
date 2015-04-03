import CSSMediaQueryParser
import argparse
import re
import tinycss


class CssToLess(object):
    NESTED_AT_RULES = ['@media', '@page', '@keyframes', '@supports', '@document']

    def __init__(self, f, output, pretty_print, variable_map):
        self.set_delimiters(pretty_print)
        self.variable_map, self.variable_regex = self.parse_variables(variable_map)
        print self.variable_map
        print self.variable_regex.pattern
        self.less = []
        self.at_rules = []
        self.rules = {}
        self.font_faces = []

        parser = CSSMediaQueryParser.CSSMediaQueryParser()
        self.stylesheet = parser.parse_stylesheet_file(f)
        
        self.build_structure()
        self.build_rules_tree()
        self.save(output)
        

    def set_delimiters(self, pretty_print):
        self.tab = '\t' if pretty_print else ''
        self.open = ' {\n' if pretty_print else '{'
        self.close = '}\n' if pretty_print else '}'
        self.colon = ': ' if pretty_print else ':'
        self.semi_colon = ';\n' if pretty_print else ';'

    def parse_variables(self, variable_map):
        variable_regex = None
        variable = None
        if variable_map:
            with open(variable_map) as f:
                variable = {key.strip():value.strip() for (key, value) in [line.split(',') for line in f]}
                variable_regex = re.compile('|'.join([re.escape(key) for key in variable.keys()]), re.M)

        return variable, variable_regex

    def build_structure(self):
        for rule in self.stylesheet.rules:
            if not rule.at_keyword:
                self.add_selector(rule)
            else:
                self.add_at_rule(rule)

    def add_selector(self, rule, at_rule = ''):
        sels = rule.selector.as_css().split(',')
        for sel in sels:
            self.add_rule(sel, rule.declarations, at_rule)

    def add_rule(self, sel, declarations, at_rule = ''):
        sel = sel.strip()
        tokens = sel.split()
        current_level = self.rules if not at_rule else self.rules[at_rule]

        for token in tokens:
            if token not in current_level:
                current_level[token] = {}
            current_level = current_level[token]

        for declaration in declarations:
            current_level[declaration.name] = declaration.value.as_css()

    def add_at_rule(self, rule):
        if rule.at_keyword in self.NESTED_AT_RULES:
            psuedo_selector = ' '.join([rule.at_keyword, rule.content])

            if psuedo_selector not in self.rules:
                self.rules[psuedo_selector] = {}

            for child in rule.rules:
                self.add_selector(child, psuedo_selector)

        elif rule.at_keyword == '@font-face':
            self.font_faces.append({declaration.name: declaration.value.as_css() for declaration in rule.rules})
    
        else:
            self.at_rules.append(rule.display())

    def build_rules_tree(self, tab_count = 0, obj = {}):
        if obj == {}:
            obj = self.rules

        for key in obj:
            if type(obj[key]) == dict:
                self.less.append(''.join([self.tab * tab_count, key, self.open]))

                self.build_rules_tree(tab_count + 1, obj[key])
                
                self.less.append(''.join([self.tab * tab_count, self.close]))
            else:
                self.less.append(''.join([self.tab * tab_count, key, self.colon, obj[key], self.semi_colon]))

    def replace_vars(self, content):
        if not self.variable_map:
            return content
        else:
            return self.variable_regex.sub(lambda x: self.variable_map[x.group(0)], content)


    def save(self, output):
        with open (output, 'w') as f:
            for key in self.variable_map.keys():
                f.write(''.join([self.variable_map[key], self.colon, key, self.semi_colon]))

            for rule in self.at_rules:
                f.write(self.replace_vars(''.join([rule, self.semi_colon])))

            for font in self.font_faces:
                f.write(''.join(['@font-face', self.open]))
                
                for key in font:
                    f.write(self.replace_vars(''.join([self.tab, key, self.colon, font[key], self.semi_colon])))
                
                f.write(self.close)

            for item in self.less:
                f.write(self.replace_vars(item))

    def dump(self): # for debugging
        for attr in dir(self):
            if hasattr(self, attr):
                print( "self.%s = %s" % (attr, getattr(self, attr)))

if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='Translate a complex css file into a valid LESS file')
    ap.add_argument('input', help='CSS file to translate.')
    ap.add_argument('output', help='LESS output file.', default='output.less', nargs='?')
    ap.add_argument('-p', '--pretty', dest='pretty_print', help='Pretty print the output file.', action='store_true')
    ap.add_argument('-m', '--map', dest='variable_map', help='Path to file with variable map. Format: 1 variable per line, value first then variable name, comma separated.')
    args = ap.parse_args()

    ctl = CssToLess(args.input, args.output, args.pretty_print, args.variable_map)
    print ctl.variable_regex

