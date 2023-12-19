(function($){


    var data; // Declare the variable to store data

    $.getJSON('json/data.json', function(response) {

        // Handle the data once it's loaded
        data = response;

        // Some vars, including scroll magic controller
        var controller = new ScrollMagic.Controller();
        var nbQuestion = data.length;
        var nbAnswered = 0;
        var nbCorrect = 0;
        var percentCorrect = 0;

        // This updates vars when answering a question. Check if it is time to remove the warning
        updateStats();
        function updateStats(){
            $('.nb-question').html(nbQuestion);
            $('.nb-correct').html(nbCorrect);
            $('.percent-correct').html(percentCorrect);

            //All Q should be answered for removing the message
            if (nbAnswered === nbQuestion)
            {
                $('.warning').fadeOut();
            }
        }

        // This generates HTML from template and data
        buildQuestions(data);
        function buildQuestions(data){
            var source = $("#question-template").html();
            var template = Handlebars.compile(source);

            // For each question, add the 'totalQuestions' property
            var templateData = data.map(function (question, index) {
                return {
                    ...question,
                    index, // Assuming you want to keep the 'index' property
                    totalQuestions: data.length,
                };
            });

            var html = template({ 'question': templateData });
            $(".questions").prepend(html);
        }

        // This happens when clicking on a answer
        $('.answer').on('click', function () {

            // This is done if the question has NOT been answered (security breach here because based on "answered" class)
            if(!$(this).closest('.question').hasClass('answered'))
            {
                nbAnswered = nbAnswered + 1;
            
                // Check if the answer is true or not
                var questionIndex = $(this).closest('.question').attr('id').replace('q', '');
                var answerIndex = $(this).index();
                var answerIsTrue = data[questionIndex].questionAnswers[answerIndex].answerIsTrue;
                var questionHint = data[questionIndex].questionHint;

                // Highlight giver answer and show hint if exists
                // Answer is true here
                if (answerIsTrue) 
                {
                    $(this).addClass('correct');
                    if (questionHint) {
                        //$(this).closest('.question').find('.hint').html('<span class="correct-txt font-semibold underline decoration-2">Correct:</span> ' + questionHint);
                        $(this).closest('.question').find('.hint').html('<span class="font-semibold underline decoration-2">Explications:</span> ' + questionHint);
                    }
                    nbCorrect = nbCorrect + 1;
                    
                }
                // Answer is false here
                else {
                    $(this).addClass('error');
                    $(this).closest('.question').find('.answer').each(function () {
                        if (data[questionIndex].questionAnswers[$(this).index()].answerIsTrue) {
                            $(this).addClass('correct');
                        }
                    });
                    if (questionHint) {
                        //$(this).closest('.question').find('.hint').html('<span class="error-txt font-semibold underline decoration-2">Erreur:</span> ' + questionHint);
                        $(this).closest('.question').find('.hint').html('<span class="font-semibold underline decoration-2">Explications:</span> ' + questionHint);
                    }

                }

                // Add the "answered" class here. Not ideal
                $(this).closest('.question').addClass('answered');

                // Calculate the % correct answers
                percentCorrect = (100 / nbQuestion * nbCorrect).toFixed(2);

                // Update vars
                updateStats();
            }
        });

        ////////////////////////////////////////////////////////////////
        //  GSAP ANIMATION
        ////////////////////////////////////////////////////////////////
        //  Quiz vars for animation
        var $sumup = $('.sumup');
        var $gauge = $('.gauge');
        var $gaugeCursor = $gauge.find('.gauge-cursor');
        var $gaugeBg = $gauge.find('.gauge-bg');
        var $nbResults = $sumup.find('.nb-results');
        var $percentResults = $sumup.find('.percent-results');
        var $finalText = $sumup.find('.final-text');
        var $btnRedo = $sumup.find('.btn-redo');
        var $btnShar = $sumup.find('.btn-shar');
        
        clearGaugeStage();
        function clearGaugeStage(){
            var clearGaugeStageTl = new TimelineMax();
            clearGaugeStageTl
                .set($sumup, { autoAlpha: 0.3, transformOrigin: "center center" })
                .set($gaugeBg, { autoAlpha: 0, y: "-=10px", transformOrigin: "center center" })
                .set($gaugeCursor, { autoAlpha: 0, y: "-=20px", transformOrigin: "center center" })
                .set($nbResults, { autoAlpha: 0, y: "-=10px", transformOrigin: "center center" })
                .set($percentResults, { autoAlpha: 0, y: "-=10px", transformOrigin: "center center" })
                .set($finalText, { autoAlpha: 0, transformOrigin: "center center" })
                .set($btnRedo, { autoAlpha: 0, y: "-=10px", transformOrigin: "center center" })
                .set($btnShar, { autoAlpha: 0, y: "-=10px", transformOrigin: "center center" });
            return clearGaugeStageTl;
        }

        // Animation trigger
        var statsDisplayed = false;
        new ScrollMagic.Scene({triggerElement: ".gauge"})
            .on("enter", function (event) {

                // Make the result animation only if all Q have been answered
                if(nbAnswered === nbQuestion)
                {
                    // Make the result animation only if never been done
                    if(statsDisplayed == false)
                    {
                        // Just lower a bit percentCorrect to avoid cursor goinf too far (left: 100%)
                        if(percentCorrect == 100){ percentCorrect = 95 }

                        // Result animation
                        var gaugeTl = new TimelineMax({ paused: true })
                            .to($sumup, .3, { autoAlpha: 1, ease: Power4.easeInOut })
                            .to($gaugeBg, 1, { autoAlpha: 1, y: "+=10px", ease: Power4.easeInOut })
                            .to($gaugeCursor, .5, { autoAlpha: 1, y: "+=20px", ease: Power4.easeInOut, onComplete: updateNumber }, "-=0.5")
                            .to($nbResults, .3, { autoAlpha: 1, y: "+=10px", ease: Power4.easeInOut })
                            .to($gaugeCursor, 2, { left: percentCorrect + "%", ease: Power4.easeInOut, onComplete: updatePercent })
                            .to($percentResults, .3, { autoAlpha: 1, y: "+=10px", ease: Power4.easeInOut })
                            .to($finalText, .3, { autoAlpha: 1, ease: Power4.easeInOut }, "+=1.5")
                            .to($btnRedo, .7, { autoAlpha: 1,  y: "+=10px", ease: Power4.easeInOut }, "+=1.7")
                            .to($btnShar, .7, { autoAlpha: 1,  y: "+=10px", ease: Power4.easeInOut });
                        gaugeTl.play();
                        statsDisplayed = true;
                    }
                    else
                    {
                        //.to($nbResults, .3, { autoAlpha: 1, y: "+=10px", ease: Power4.easeInOut })
                    }
                }
                else
                {
                    
                }
            }).triggerHook(0.6).addTo(controller);

        ////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////

        // Counting result number effect (plugin based counter-up.js)
        function updateNumber(){
            $('.nb-correct').counterUp({
                delay: 10,
                time: 1000
            });
        }

        // Counting result percent effect (plugin based counter-up.js)
        function updatePercent(){
            $('.percent-correct').counterUp({
                delay: 10,
                time: 1000
            });
        }

        //Trigger share panel when clicking on .sumpup .btn-shar
        $('.btn-shar').on('click', function () {
            $('.aside-r-toggle').click();
        });
        
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        // Handle errors if the request fails
        console.error('No quiz data found', textStatus, errorThrown);
    });

    // The questions array

    // data = [
    //     { 
    //         questionImg: "q-chihuahuas.png",
    //         questionTxt: "Combien de chihuahuas se cachent dans cette image? Image facultative, nombre de propositions de votre choix, une seule bonne réponse",
    //         questionAnswers: [
    //             {
    //                 answerTxt: "8",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "9",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "10",
    //                 answerIsTrue: true
    //             }
    //         ],
    //         questionHint: "Texte de complément ici (facultatif)"
    //     },
    //     { 
    //         questionImg: "q-poodle.png",
    //         questionTxt: "Combien de vrais caniches se cachent dans cette image? Image facultative, nombre de propositions de votre choix, une seule bonne réponse",
    //         questionAnswers: [
    //             {
    //                 answerTxt: "14",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "15",
    //                 answerIsTrue: true
    //             },
    //             {
    //                 answerTxt: "16",
    //                 answerIsTrue: false
    //             }
    //         ],
    //         questionHint: "Texte de complément ici (facultatif)"
    //     },
    //     { 
    //         questionImg: "q-puddles.png",
    //         questionTxt: "Combien de vrais caniches se cachent dans cette image? Image facultative, nombre de propositions de votre choix, une seule bonne réponse",
    //         questionAnswers: [
    //             {
    //                 answerTxt: "5",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "6",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "7",
    //                 answerIsTrue: true
    //             }
    //         ],
    //         questionHint: "Texte de complément ici (facultatif)"
    //     },
    //     { 
    //         questionImg: "q-shar-pei.png",
    //         questionTxt: "Combien de Sharpeis se cachent dans cette image? Image facultative, nombre de propositions de votre choix, une seule bonne réponse",
    //         questionAnswers: [
    //             {
    //                 answerTxt: "13",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "14",
    //                 answerIsTrue: true
    //             },
    //             {
    //                 answerTxt: "15",
    //                 answerIsTrue: false
    //             }
    //         ],
    //         questionHint: "Texte de complément ici (facultatif)"
    //     },
    //     { 
    //         questionImg: "q-shar-pei2.png",
    //         questionTxt: "Combien de caniches se cachent dans cette image? Image facultative, nombre de propositions de votre choix, une seule bonne réponse",
    //         questionAnswers: [
    //             {
    //                 answerTxt: "5",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "6",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "7",
    //                 answerIsTrue: true
    //             }
    //         ],
    //         questionHint: "Texte de complément ici (facultatif)"
    //     },
    //     { 
    //         questionImg: "q-sheep-dog.png",
    //         questionTxt: "Combien chien se cachent dans cette image? Image facultative, nombre de propositions de votre choix, une seule bonne réponse",
    //         questionAnswers: [
    //             {
    //                 answerTxt: "6",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "7",
    //                 answerIsTrue: false
    //             },
    //             {
    //                 answerTxt: "8",
    //                 answerIsTrue: true
    //             }
    //         ],
    //         questionHint: "Texte de complément ici (facultatif)"
    //     }
    // ];

    // Base introduction effects

    window.scrollTo(0, 0);
    setTimeout(function() { 
        $('body').addClass('is-visible');
    }, 1000);

    

    
    
    // Simple helper to start counting question from 1 and not from 0
    Handlebars.registerHelper('indexFormatter', function(index) {
        return index+1;
    });

    

    

    

    

    



    
    

    
  
	
   
  
})(jQuery);

