padeditor.enable = function()
{
    if (padeditor.ace)
    {
	padeditor.ace.setProperty("grayedOut", false);
        padeditor.ace.setEditable(true);
    }
}

function readonlyPad_moveTop(start, height)
{
    var el = start;
    var el_pos;
    
    do {
	if(el.length==0)
	{
	    return;
	}
    
	if(el[0] && el[0].nodeName && el[0].nodeName.toLowerCase()=='div')
	{
	    if(el.children().length>0)
	    {
		readonlyPad_moveTop(el.children().eq(0), height);
	    }
	}
	
	el_pos = el.position();
	if(el_pos && el_pos.top>0)
	{
	    el.css('top', el_pos.top + height + 'px');
	}
    } while(el = el.next());
}

function readonlyPad_adminInit()
{
    var div = $('div#readonlyPad');
    var access = $('div#security-access');
    
    if(div.length>1)
    {
	var el = div.eq(0);
	while((el = el.next()) && el.length>0)
	{
	    el.remove();
	}
    }
    
    access.after(div);
    var access_private_pos = $('#access-private-label').position();
    var access_public_pos  = $('#access-public-label').position();
    
    var height = (access_public_pos.top - access_private_pos.top);
    
    div.css('top', (access_public_pos.top + height) + 'px');
    div.removeClass('readonlyPadHidden');
    
    readonlyPad_moveTop(div.next(), height);
    
    $('#security-panel').css('height', $('#security-panel').height() + height);
    
    if(clientVars.initialOptions && clientVars.initialOptions.view && clientVars.initialOptions.view.readonlyPadPolicy)
    {
	$('#readonlyPadCheckbox')[0].checked = true;
    }
    
    $('#readonlyPadCheckbox').bind('change click', function(evt) {
	pad.changeViewOption('readonlyPadPolicy', $('#readonlyPadCheckbox')[0].checked)
    });
}

function readonlyPad_guestInit()
{
    if(clientVars.initialOptions && clientVars.initialOptions.view && clientVars.initialOptions.view.readonlyPadPolicy)
    {
	padeditor.disable();
    }
}

function readonlyPad_handleOptionsChange(opts)
{
    if(opts && opts.view && opts.view.readonlyPadPolicy!=null)
    {
	if(clientVars["userIsGuest"]==true)
	{
	    if(opts.view.readonlyPadPolicy==true)
	    {
		padeditor.disable();
	    }
	    else
	    {
		padeditor.enable();
	    }
	}
	else
	{
	    $('#readonlyPadCheckbox')[0].checked = opts.view.readonlyPadPolicy;
	}
    }
}


function readonlyPad_handleInit()
{
    var old = pad.handleOptionsChange;
    
    pad.handleOptionsChange = function(opts)
    {
	old(opts);
	readonlyPad_handleOptionsChange(opts);
    }
    
    
}

$(document).ready(function ()
{

    if(clientVars["isProPad"]==true)
    
    if(clientVars["userIsGuest"]==true)
    {
	readonlyPad_guestInit();
    }
    else
    {
	readonlyPad_adminInit();
    }
    
    readonlyPad_handleInit();
});