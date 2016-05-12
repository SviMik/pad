function restoreAnyRevisionPluginInit() {
    this.hooks = [];
    
    var isRestoring = false;
    var linkSpan = null;

    if(isBrowser()) {
        try{ // IE8 can't do that
            window.addEventListener('load', executeScript, false);
        }catch(e){};
    }
    
    function isBrowser() {
        var global = (function() {return this;})();
        return !!global.window;
    }
    
    function onLinkClick(event) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
        restoreRevision();
        return false;
    }

    function executeScript() {
        if (!clientVars || !clientVars.supportsSlider || !window.$ || !$('#rightbar'))
            return;
        linkSpan = $('<span id="restorerevision"/>').
            text('Restore this revision').
            click(onLinkClick);
        $('<br/>').insertBefore($('#rightbar h2'));
        $('<a/>').insertBefore($('#rightbar h2')).append(linkSpan);
        BroadcastSlider.onSlider(updateLink);
        var oldSetSliderLength = BroadcastSlider.setSliderLength;
        BroadcastSlider.setSliderLength = function(length) {
            oldSetSliderLength(length);
            updateLink();
        }
        updateLink();
    }
    
    function updateLink() {
        if (linkSpan) {
            var isHeadRevision = BroadcastSlider.getSliderPosition() == BroadcastSlider.getSliderLength();
            if (isRestoring || isHeadRevision) {
                linkSpan.css({color: 'gray', cursor: 'default'});
            }
            else {
                linkSpan.css({color: '', cursor: 'pointer'});
            }
            if (isRestoring) {
                linkSpan.text('Restoring the revision...');
            }
            else {
                linkSpan.text('Restore this revision');
            }
        }
    }

    function restoreRevision() {
        if (isRestoring)
            return;
        var warning = 'Restoring this revision will overwrite the current text of the pad. Are you sure you want to continue?';
        if (!confirm(warning))
            return;
        var rev = BroadcastSlider.getSliderPosition();
        isRestoring = true;
        updateLink();
        $.ajax({
            type: 'get',
            url: '/ep/restorerevision/'+clientVars.padIdForUrl+'/'+rev,
            success: function (text, status, xhr) {
            },
            error: function (xhr, status, message) {
                var alertMessage = 'Couldn\'t restore the revision (error ' + xhr.status + ').';
                if (xhr.status == 400)
                    alertMessage += '\n' + xhr.responseText;
                alert(alertMessage);
            },
            complete: function (xhr, status) {
                isRestoring = false;
                updateLink();
            }
        });
    }
}


restoreAnyRevision = new restoreAnyRevisionPluginInit();
