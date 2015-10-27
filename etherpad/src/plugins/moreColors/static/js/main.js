function moreColorsInit() {
    this.hooks = ['padCollabClientInitialized'];
    this.padCollabClientInitialized = padCollabClientInitialized;
    this.version = '0.3';

    function padCollabClientInitialized() {
        //generate&add colors
        var arr1 = ['00','33','66','99','CC','FF'];
        var arr = [];
        for (var r = 0; r < arr1.length; r++) {
            for (var g = 0; g < arr1.length; g++) {
                for (var b = 0; b < arr1.length; b++) {
                    clientVars.colorPalette.push('#'+arr1[r]+arr1[g]+arr1[b]);
                };
            };
        };
        
        if (pad.myUserInfo.userId.substring(0,1) != 'g') {
            // make color picker
            $("#myswatchbox").click(function() {
                $("#mycolorpicker .pickerswatchouter").removeClass('picked');

                $("#mycolorpicker .x" + (clientVars.customColor+1) + ".pickerswatchouter").addClass('picked');
                $("#mycolorpicker").css('display', 'block');
            });
            $('#mycolorpicker div').remove();
            $('#mycolorpicker').css('background', '#ffffff');
            $('#mycolorpicker').css('border', '1px solid #000000');
            $('#mycolorpicker').css('border-radius', '7px');
            $('#mycolorpicker').css('height', '641px'); // last top + 29px

            var cols = 8;
            var watches = '<style>';
            for (var i = 1; i <= pad.getColorPalette().length; i += cols) {
                for (var j = i; j < i + cols; j++) {
                    watches += '#mycolorpicker .x' + j + ' {';
                    watches += 'left:' + (13+27*((j-1) % cols)) + 'px;';
                    if (i > 1) {
                        watches += 'top:' + (12 + (~~((i-1) / 8)) * 20) + 'px !important;';
                    }
                    watches += '}';
                }
            }
            watches += '</style>';
            for (var i = 1; i <= pad.getColorPalette().length; i += cols) {
                watches += '<div>';
                for (var j = i; j < i + cols; j++)
                    watches += '<div class="pickerswatchouter x' + j + '"><div class="pickerswatch" style="background-color: ' + pad.getColorPalette()[j-1] + '; background-position: initial initial; background-repeat: initial initial"></div></div>';
                watches += '</div>';
            }
            $('#mycolorpicker').prepend(watches);
            $("#mycolorpicker .pickerswatchouter").click(function() {
                console.log('lol');
                $("#mycolorpicker .pickerswatchouter").removeClass('picked');
                $(this).addClass('picked');
                function getColorPickerSwatchIndex(jnode) {
                    return Number(jnode.get(0).className.match(/\bx([0-9]+)\b/)[1])-1;
                }
                var newColorId = getColorPickerSwatchIndex($("#mycolorpicker .picked"));
                $("#mycolorpicker").css('display', 'none');
                window.pad.notifyChangeColor(newColorId);
                window.padeditor.ace.setAuthorInfo(clientVars.userId, {bgcolor: pad.getColorPalette()[newColorId]});
                $("#myswatch").css('background-color', pad.getColorPalette()[newColorId])
            });
        }
    }
}

moreColors = new moreColorsInit();
