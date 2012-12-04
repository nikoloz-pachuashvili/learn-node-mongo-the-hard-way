require 'test/unit'
require_relative '../lib/ex49'

class ParserTests < Test::Unit::TestCase

    def test_parse_verb()
        # WARNING: THIS FAILS ON PURPOSE SEE THE BOOK
        Parser.parse_verb([false])
    end

end
