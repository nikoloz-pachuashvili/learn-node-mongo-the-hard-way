class Lexicon
    LEXEMES = {
        "north" => :direction, "south"  => :direction, "east"   => :direction,
        "west"  => :direction, "down"  => :direction, "left"  => :direction,
        "right" => :direction, "back" => :direction, "go" => :verb,
        "stop" => :verb, "kill" => :verb, "eat" => :verb,
        "the" => :stop, "in" => :stop, "of" => :stop,
        "from" => :stop, "at" => :stop, "it" => :stop,
        "door" => :noun, "bear" => :noun, "princess" => :noun,
        "cabinet" => :noun
    }

    Pair = Struct.new(:token, :word)

    def scan(sentence)
        words = sentence.split()
        results = []

        for word in words
            as_number = self.convert_number(word)

            if as_number
                results += [Lexicon::Pair.new(:number, as_number)]
            else
                word_type = LEXEMES[word]
                results += [Lexicon::Pair.new(word_type ? word_type : :error, word)]
            end
        end

        return results
    end

    def convert_number(s)
        begin
            Integer(s)
        rescue ArgumentError
            nil
        end
    end
end
