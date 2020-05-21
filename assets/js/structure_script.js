
                // ---------------------------------------------------------
                // Global
                // ---------------------------------------------------------

                var keys = Object.keys(fieldName);
                var annotations = {};
                var values = {};
                var key;

                // ---------------------------------------------------------
                // Create jQuery elements
                // ---------------------------------------------------------
                var currentIndex = 0;
                var raw = $('div#raw');
                var spans = $('div#spans');
                var qspans = $('div#overlaps');
                var well = $('div#well');
                var submit = $('input#submit');
                var choice = $('div#choice');
                var keyname = $('div#key-name');
                var form = $("div#form");
                var questions = $('div#questions');
                var structure = $('div#structures');

                var rawList = JSON.parse(raw.text());
                var questionList = JSON.parse(questions.text());
                var structureList = JSON.parse(structure.text());
                var numQ = rawList.length;
                var curRaw = rawList[currentIndex];
                var curQuestion = questionList[currentIndex];
                var curStructure = JSON.parse(structureList[currentIndex]);


                
                var questionSub = $('#question-sub')
                var passageSub = $('#passage-sub')
                var qspans = $('#overlaps');
                var well = $('#well');
                var submitButton = $('#submit');
                var choice = $('#choice');
                var keyname = $('#key-name');
                var finalAnswer = $('input#all_answers');
                var finalQuestions = $('input#all_questions');
                var finalContexts = $('input#all_contexts');
                var qcomplete = $('h4#qcomplete')
                var form = $("#form");

                var qOverlap = [];
                var answer = {};
                var tagHidden = {};
                var skip = {}
                var radios = {};
                // answerHiddenDuplicates value of answer but is needed because
                // otherwise the data is not sent
                var answerHidden = {};
                var finalAnswerList = [];
                var currentlyChecked = false;
                var oldAnnotations = [];
                var curKeys = [];

                var makeInstruction = function(key) {
                    return ($(
                        '<tr>')
                        .append($('<td>').text(fieldName[key]))
                        .append($('<td>').text(longDesc[key]))
                    );
                }

                var makeChoice = function(key) {
                    var input = ($(
                        '<input>')
                        .attr({
                            'name': 'choice', 'id': key + "-choice",
                            'value': key, 'type': 'radio', 'data-key': shortcutKey[key]
                        })
                        .text(fieldName[key])
                    );
                    radios[key] = input;
                    var label = ($(
                        '<label>')
                        .addClass('btn btn-default')
                        .text(fieldName[key])
                        .append(input)
                        .attr({'title': "Shortcut: " +  shortcutKey[key]})
                        .attr('hidden')
                    );
                    return label;
                }

                var makeAnswerHidden = function(key) {
                    var input = ($(
                        '<input>')
                        .attr({'name': key, 'id': key + "-hidden"})
                    ); 
                    answerHidden[key] = input;
                    return input;
                }

                var makeTagHidden = function(key) {
                    var input = ($(
                        '<input>')
                        .attr({'type': 'hidden', 'name': key + "-tag", 'id': key + "-tag"})
                    );
                    tagHidden[key] = input;
                    return input;
                }


                var makeFormRow = function(key, id, hint="", isAttr=false) {
                    var fillText = key;
                    if (isAttr) {
                        fillText = "Attribute: '" + key + "'";
                    }
                    var skipCheckbox = ($(
                        '<input>')
                        .attr({'type': 'checkbox', 'id': "skip-" + id})
                        .addClass('form-check-input')
                        .change(function() { show(); })
                    );

                    var skipLabel = ($(
                        '<label>')
                        .attr({'for': "skip-" + key})
                        .addClass('form-check-label')
                        .text('Question is not answerable (NA)')
                    );

                    // Answer box!!! TODO
                    var input = ($(
                        '<input>')
                        .attr({'type': 'text',  'id': id, "placeholder": hint})
                        .addClass('form-control')
                    );
                    console.log(key)
                    var div = ($(
                        '<div>')
                        .addClass('col-xs-12 col-sm-12 content')
                        .append($('<label>')
                            .attr({'for': key, "id": "label-" + id})
                            .text(fillText) // PUT TEXT HERE
                        )
                  .append($('<div>')
                            .addClass('form-row')
                            .append($('<div>')
                                .addClass('col-sm-8')
                                .append(input)
                            )
                      .append($('<div>')
                          .addClass('col-sm-4')
                                .append($('<div>')
                                    .addClass('form-check')
                                    .append(skipCheckbox)
                              .append(' ')
                        .append(skipLabel)
                          )
                            )
                        )
                    );
                    answer[key] = input;
                    skip[key] = skipCheckbox;
                    return div;
                }


                var makeDom = function() {
                    var attrDict = Object.values(curStructure)[0];
                    var mainObj = Object.keys(curStructure)[0];
                    if (mainObj.slice(-1) == "s") {
                        // drop the plural form
                        form.append(makeFormRow("Enter a single '" + mainObj.slice(0, -1) + "' here:", mainObj.replace(/ /g,"_")));
                    } else {
                        form.append(makeFormRow("Enter a single '" + mainObj + "' here:", mainObj.replace(/ /g,"_")));
                    }
                    curKeys.push(mainObj.replace(/ /g,"_"))
                    for (var curAttr of attrDict) {
                        var allKeys = Object.keys(curAttr);
                        // all dicts have this
                        var indexOfValues = allKeys.indexOf("all_values");
                        allKeys.splice(indexOfValues, 1);
                        // only should be one left
                        var nameOfAttr = allKeys[0]
                        let placeholder = curAttr[nameOfAttr]
                        form.append(makeFormRow(nameOfAttr, nameOfAttr.replace(/ /g,"_"), hint=placeholder, isAttr=true));
                        curKeys.push(nameOfAttr.replace(/ /g,"_"))
                        // form.append(makeTagHidden(key));
                        // form.append(makeAnswerHidden(key));
                        // choice.append(makeChoice(key));
                        annotations[key] = [];
                        values[key] = "";
                    }
                }


                // ---------------------------------------------------------
                // Displaying
                // ---------------------------------------------------------

                var sequence_html = function(sequence, annotations, overlaps) {
                    var ret = _.map(sequence, function(token, index) {
                  if (token == '[PAR]' || token == '[DOC]'){
                      token = '<br><br>'
                  };
                  if (token == '[TLE]'){
                      token = ' '
                  };
                        return '<span class="token" id=tok_' + index + '> '
                            + token + ' </span>';
                    });
                    console.log(overlaps);
                    _.each(overlaps, function(overlap) {
                        ret[overlap[0]] = '<strong class="overlap">'
                            + ret[overlap[0]];
                        ret[overlap[1]-1] = ret[overlap[1]-1] + '</strong>';
                    });    
                    _.each(annotations, function(annotation) {
                        ret[annotation[0]] = '<strong class="annotation">'
                            + ret[annotation[0]];
                        ret[annotation[1]-1] = ret[annotation[1]-1] + '</strong>';
                    });

                    return ret.join(' ');
                }


                var canSubmit = function(strict=true) {
                    let isNotEmpty = true;
                    for (var key of curKeys) {
                        let curInput = $("input#" + key).val()
                        indAnswers[key] = curInput
                        if (curInput == "") {
                            isNotEmpty = false;
                        }
                        if (curStructureHints) {
                            if (!validateAnswer(key, curInput, strict_alert=strict)) {
                                return false;
                            }
                        }
                    }
                    if (isNotEmpty) {
                        saveAnswers(indAnswers)
                        return true;
                    } else {
                        return false;
                    }
                }

                var show = function() {
                    // annotations[key].sort(function(a, b) {
                    //     return a[0] - b[0];
                    // });
                    label = $('input#skip-answer').prop('checked')
                    if (label !== currentlyChecked) {
                        if (label) {
                            oldAnnotations = annotations[key]
                            annotations[key] = []
                            currentlyChecked = true;
                        } else {
                            annotations[key] = oldAnnotations
                            currentlyChecked = false;
                        }
                    }
                    //fill_annotated_values(datum);
                    // seq_html = sequence_html(tokens, annotations[key], qOverlap);
                    // well.html(seq_html);
                    // values[key] = get_value();
                    // answer[key].val(values[key]);
                    // answerHidden[key].val(values[key]);
                    // tagHidden[key].val(annotations[key]);
                    keyname.html(shortName[key]);


                    // Handler on tokens
                    $(".token").mousedown(function() {
                        mouse_down(parseInt($(this).attr('id').split("_")[1]));
                    });
                    $(".token").mouseup(function() {
                        mouse_up(parseInt($(this).attr('id').split("_")[1]));
                    });

                    if (canSubmit(strict=false)) {
                        submitButton.removeAttr("disabled");
                        submitButton.removeClass("btn-default");
                        submitButton.addClass("btn-success");
                    } else {
                        submitButton.attr("disabled", "disabled");
                        submitButton.removeClass("btn-success");
                        submitButton.addClass("btn-default");
                    }
                };


                makeDom();


                // ---------------------------------------------------------
                // Event handlers
                // ---------------------------------------------------------


                var zip = function(arrays) {
                    return arrays[0].map(function(_,i){
                        return arrays.map(function(array){return array[i]})
                    });
                }

                var saveAnswers = function(indAnswers) {
                    if (curAnswers.length == currentIndexOfIndividuals) {
                        curAnswers.push($.extend(true,{},indAnswers));
                        console.log("saving. curAnswers is now length", curAnswers.length);
                    } else{
                        curAnswers[currentIndexOfIndividuals] = $.extend(true,{},indAnswers);
                        console.log("Overwriting current answers at", currentIndexOfIndividuals, " to be", indAnswers);
                    }
                }

                var getValueCurrent = function() {
                    for (var key of curKeys) {
                        let curInput = $("input#" + key).val()
                        indAnswers[key] = curInput
                    }
                    return indAnswers;
                }

                var toggleInputBoxForKey = function(key, disable) {
                        $(key).prop('disabled', disable);
                }

            
                var fillBoxesWithAnswer = function(givenDict, clear) {
                    console.log("Filling dict with", givenDict, "clearing = ", clear)
                    for (var key in givenDict) {
                        if (clear) {
                            $("input#skip-" + key).prop('checked', false);
                            toggleInputBoxForKey("input#" + key, disable=false)
                            $("input#" + key).val("")
                        } else {
                            if (givenDict[key] == NA_KEY) {
                                $("input#skip-" + key).prop('checked', true);
                                toggleInputBoxForKey("input#" + key, disable=true)
                                $("input#" + key).val(NA_KEY)
                            } else {
                                $("input#" + key).val(givenDict[key])
                                $("input#skip-" + key).prop('checked', false);
                                toggleInputBoxForKey("input#" + key, disable=false)
                            }
                        }
                    }
                }

                var loadDefaultState = function(givenIndex) {
                    if (curAnswers.length > givenIndex) {
                        let fillAnswer = curAnswers[givenIndex]
                        console.log("Loading previous answer at index", givenIndex, fillAnswer)
                        fillBoxesWithAnswer(fillAnswer, false)
                    } 
                    else {
                        // makes it easier to call the function
                        let curKeyDict = {}
                        for (key of curKeys) {
                            curKeyDict[key] = -1
                        }
                        console.log("Loading next unknown answer at index", givenIndex)
                        fillBoxesWithAnswer(curKeyDict, true)
                    }
                }

                var clearInput = function() {
                    for (key in curAnswers[currentIndexOfIndividuals]) {
                        curAnswers[currentIndexOfIndividuals][key] = ""
                    }
                    loadDefaultState(currentIndexOfIndividuals)
                }

                $("#clear").click(function() {
                    clearInput();
                    show();
                });

                $("#delete").click(function() {
                    console.log("Deleting answer at index", currentIndexOfIndividuals)
                    curAnswers.splice(currentIndexOfIndividuals, 1);
                    if (currentIndexOfIndividuals) {
                        currentIndexOfIndividuals = currentIndexOfIndividuals - 1;
                    }
                    loadDefaultState(currentIndexOfIndividuals)
                    show();
                });

                $("#previous").click(function() {
                    if (currentIndexOfIndividuals) {
                        let isNotEmpty = true;
                        let allEmpty = true;
                        let allMatches = true;
                        let isValid = true;
                        for (var key of curKeys) {
                            let curInput = $("input#" + key).val()
                            indAnswers[key] = curInput
                            if (curInput == "") {
                                isNotEmpty = false;
                            } else {
                                allEmpty = false;
                            }
                            isValid = validateAnswer(key, curInput);
                        }

                        if (!allEmpty && !isNotEmpty && isValid) {
                            alert("Empty input in a box - please clear the form or fill in the box");
                        }
                        else if (!isValid) {
                            // nothing
                        }
                        else if ((allEmpty || isNotEmpty) && allMatches) {
                            saveAnswers(indAnswers)
                            console.log("Updating ", currentIndexOfIndividuals, "to be", indAnswers)
                            currentIndexOfIndividuals = currentIndexOfIndividuals - 1;
                            loadDefaultState(currentIndexOfIndividuals)
                        }
                    }
                    show();
                });

                var validateAnswer = function(key, curInput, strict_alert=true) {
                    let valid = true;
                    for (answer of curInput.split("|")) {
                        if (answer == "") {
                            // checking for emptyness is handled outside of this function
                            continue
                        }
                        if (curStructureHints[key] == "" || !(key in curStructureHints)) {
                            if (!curRaw.toLowerCase().includes(answer.toLowerCase()) && answer != NA_KEY) {
                                valid = false;
                                if (strict_alert) {
                                    alert("The input text '" + answer + "' does not match the passage. Please make it an exact match");
                                }
                                return valid;
                            }
                        } else {
                            if (!curStructureHints[key].includes(curInput.toLowerCase()) && curInput != NA_KEY && curStructureHints[key] != []) {
                                valid = false;
                                if (strict_alert) {
                                    alert("The input text '" + answer + "' does not match the allowed values: " + curStructureHints[key].toString() + ". Please make it an exact match");
                                }
                                return valid;
                            }
                        }
                    }
                    return valid;
                }

                $("#next").click(function() {
                    let isNotEmpty = true;
                    let isValid = true;
                    for (var key of curKeys) {
                        let curInput = $("input#" + key).val()
                        indAnswers[key] = curInput
                        if (curInput == "") {
                            isNotEmpty = false;
                            alert("Can't go to the next box when a box is empty!");
                            break;
                        }
                        if (isValid) {
                            isValid = validateAnswer(key, curInput);
                        }
                    }
                    if (isNotEmpty && isValid) {
                        saveAnswers(indAnswers);
                        console.log("Updating ", currentIndexOfIndividuals, "to be", indAnswers)
                        indAnswers = {};
                        currentIndexOfIndividuals = currentIndexOfIndividuals + 1;
                        loadDefaultState(currentIndexOfIndividuals);
                    }

                    
                    show();
                });

                $("#prevSubmitted").click(function() {
                    if (currentIndex) {
                        let prevAnswers = finalAnswerList[currentIndex - 1]
                        finalAnswerList.splice(currentIndex, 1);
                        finalAnswerList.splice(currentIndex - 1, 1);
                        console.log(finalAnswerList, "is the new final answer list")
                        currentIndex = currentIndex - 1;
                        curRaw = rawList[currentIndex];
                        curQuestion =  questionList[currentIndex];
                        curStructure = JSON.parse(structureList[currentIndex]);
                        curStructureHints = parseStructureChoices(curStructure)
                        initializeText();
                        curAnswers = prevAnswers;
                        currentIndexOfIndividuals = 0;
                        loadDefaultState(currentIndexOfIndividuals);
                        show();
                    }
                });

                var noneSubmit = function() {
                    // an explicit none answer becomes an empty list
                    return nextTask(explicitNull=true);
                }

                $("#noneSubmitted").click(function() {
                    return noneSubmit();
                });

                $(document).on('click', '.form-check-input', function() {
                    if ($("input#" + this.id).is(':checked')) {
                        toggleInputBoxForKey("input#" + this.id.replace("skip-", ""), disable=true)
                        $("input#" + this.id.replace("skip-", "")).val(NA_KEY)
                    } else {
                        toggleInputBoxForKey("input#" + this.id.replace("skip-", ""), disable=false)
                        $("input#" + this.id.replace("skip-", "")).val("")
                    }
                });

                //on keyup
                $(document).on('keyup', '.form-control', function() {
                    canSubmit(strict=false)
                    show();
                });
        

                //highlight selected category
                var inputs = $("#choice input:radio");
                inputs.change(function(){
                    inputs.parent().removeClass("btn-success");
                    inputs.parent().addClass("btn-default");
                    if($(this).is(":checked")){
                        key =  $(this).val();
                        $(this).parent().removeClass("btn-default");
                        $(this).parent().addClass("btn-success");
                        show();
                    }else{
                        $(this).parent().removeClass("btn-success");
                        $(this).parent().addClass("btn-default");
                    }
                });

                // // If I wanted the instruction body, which is currently deleted
                // // Instructions expand/collapse
                // var content = $('#instructionBody');
                // var trigger = $('#collapseTrigger');
                // content.hide();
                // $('.collapse-text').text('(Click to expand)');
                // trigger.click(function(){
                //     content.toggle();
                //     var isVisible = content.is(':visible');
                //     if(isVisible){
                //         $('.collapse-text').text('(Click to collapse)');
                //     }else{
                //         $('.collapse-text').text('(Click to expand)');
                //     }
                // });

                // every submit button should take us here
                var nextTask = function(explicitNull=false) {
                    
                    if (canSubmit() || explicitNull) {
                        if (!explicitNull) {
                            savedAnswer = getValueCurrent();
                            saveAnswers(savedAnswer);
                        } else {
                            curAnswers = [];
                        }
                        finalAnswerList.push(curAnswers)
                        console.log("Added answer to set", curAnswers)
                        console.log("Full Answers", finalAnswerList)
                        if (currentIndex !== (rawList.length - 1)) {
                            currentIndex = currentIndex + 1;
                            curRaw = rawList[currentIndex];
                            curQuestion =  questionList[currentIndex];
                            curStructure = JSON.parse(structureList[currentIndex])
                            form.empty()
                            curKeys = [];
                            makeDom();
                            curStructureHints = parseStructureChoices(curStructure);
                            initializeText();
                            clearInput();
                            show();
                            return false;
                        } else {
                            finalAnswer.val(JSON.stringify(finalAnswerList))
                            finalContexts.val(JSON.stringify(rawList))
                            finalQuestions.val(JSON.stringify(questionList))
                            submitButton.unbind('submit');
                            console.log(finalAnswerList)
                            return true;
                        }
                    }
                    console.log("Tried to submit but failed")
                    return false;
                }


                // ---------------------------------------------------------
                // Initialize
                // ---------------------------------------------------------

                var initializeText = function() {
                    // tokens = curRaw.split(' ');
                    qcomplete.text(currentIndex + "/" + numQ + " Complete")
                    // // reset since it's a new question
                    // annotations[key] = []
                    // oldAnnotations = [] // reset if `NONE` was pressed
                    // $('input#skip-answer').prop('checked', false);
                    // if(spans.text().length > 0){
                    //     annotations['answer'] = spansStrToAns(spans.text());
                    // }
                    curAnswers = [];
                    indAnswers = {};
                    currentIndexOfIndividuals = 0;
                    questionSub.val(curQuestion);
                    passageSub.val(curRaw);
                    
                    // qOverlap = spansStrToAns(qspans.text());
                    show();
                }

                var parseStructureChoices = function(curStructureDict) {
                    attrToHint = {}
                    let attr = Object.values(curStructureDict)[0]
                    for (attrDict of attr) {
                        var allKeys = Object.keys(attrDict);
                        let enforceOptions = attrDict["all_values"];
                        // all dicts have this
                        var indexOfValues = allKeys.indexOf("all_values");
                        allKeys.splice(indexOfValues, 1);
                        // only should be one left
                        var nameOfAttr = allKeys[0]
                        let attrValues = attrDict[nameOfAttr].split(",").map(v => v.toLowerCase());
                        if (enforceOptions) {
                            attrToHint[nameOfAttr.replace(/ /g, "_")] = attrValues;
                            let prevVal = $("label#label-" + nameOfAttr.replace(/ /g, "_")).text()
                            if (!prevVal.includes("(")) {
                                $("label#label-" + nameOfAttr.replace(/ /g, "_")).text(prevVal + " (answer must be one of '" + attrValues.toString() + "')")
                            }
                        } else {
                            attrToHint[nameOfAttr.replace(/ /g, "_")] = [];
                        }
                    }
                    return attrToHint;
                }


                var spansStrToAns =  function(spansStrToAns) {
                    if (spansStrToAns !== "") {
                        var annList = _.map(spansStrToAns.split(","), function(el) {return parseInt(el)});
                        var i = 2, list = _.groupBy(annList, function(a, b){
                            return Math.floor(b/i);
                        });
                        return _.toArray(list);
                    } else {
                        return [];
                    }
                }
                var NA_KEY = "NA";
                var curAnswers = [];
                var indAnswers = {};
                var currentIndexOfIndividuals = 0;
                var curStructureHints = parseStructureChoices(curStructure)
                raw.hide();
                questions.hide();
                spans.hide();
                qspans.hide();
                structure.hide();
                var tokens;
                initializeText();