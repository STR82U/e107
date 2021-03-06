/*
 * e107 website system
 *
 * Copyright (C) 2008-2009 e107 Inc (e107.org)
 * Released under the terms and conditions of the
 * GNU General Public License (http://gnu.org).
 *
 * e107 Admin Helper
 *
 * $Source: /cvs_backup/e107_0.8/e107_files/jslib/core/admin.js,v $
 * $Revision$
 * $Date$
 * $Author$
 *
*/

if(typeof e107Admin == 'undefined') var e107Admin = {}

/**
 * OnLoad Init Control
 */
if(!e107Admin['initRules']) {
	e107Admin.initRules = {
		'Helper': true,
		'AdminMenu': true
	}
}

e107Admin.Helper = {

	/**
	 * Auto Initialize everything
	 *
	 * Use it with e107#runOnLoad
	 * Example: e107.runOnLoad(e107Admin.Helper.init.bind(e107Admin.Helper), document, true);
	 * Do it only ONCE per page!
	 *
	 */
	init: function(event) {
		this.toggleCheckedHandler = this.toggleChecked.bindAsEventListener(this);
		this.allCheckedEventHandler = this.allChecked.bindAsEventListener(this);
		this.allUncheckedEventHandler = this.allUnchecked.bindAsEventListener(this);
		this.allToggleCheckedEventHandler = this.allToggleChecked.bindAsEventListener(this);
		element = event.memo['element'] ? $(event.memo.element) : $$('body')[0];

		element.select('.autocheck').invoke('observe', 'click', this.toggleCheckedHandler);
		element.select('button.action[name=check_all]', 'input.toggle_all[type=checkbox]').invoke('observe', 'click', this.allCheckedEventHandler);
		element.select('button.action[name=uncheck_all]').invoke('observe', 'click', this.allUncheckedEventHandler);
		element.select('input.toggle-all[type=checkbox]').invoke('observe', 'click', this.allToggleCheckedEventHandler);
		element.select('button.delete', 'input.delete[type=image]', 'a.delete').each(function(el) {
			if(el.hasClassName('no-confirm') || (el.readAttribute('rel') &&  el.readAttribute('rel').toLowerCase() == 'no-confirm')) return;
			if(!el.readAttribute('delmsg')) {
				var msg = el.readAttribute('title') || '';
				el.writeAttribute('title', e107.getModLan('delete')).writeAttribute('delmsg', msg);
			}
		});
		element.select('button.delete', 'input.delete[type=image]', 'a.delete').invoke('observe', 'click', function(e) {
			var el = e.findElement('a.delete');
			if(!el) el = e.findElement('input.delete');
			if(!el) el = e.findElement('button.delete');
			if(!el) return;
			if(el.hasClassName('no-confirm') || (el.readAttribute('rel') &&  el.readAttribute('rel').toLowerCase() == 'no-confirm')) return;
			var msg = el.readAttribute('delmsg') || e107.getModLan('delete_confirm');
			if( !e107Helper.confirm(msg) ) e.stop();
		});
		
		element.select('textarea.e-autoheight').each( function (textarea) {  
			var options = {}, autoopt = '__' + textarea.name + 'autoheight_opt', autooptel = textarea.next('input[name=' + autoopt + ']'); 
			if(autooptel) {
				options['max_length'] = parseInt(autooptel.value);
			}
			new e107Admin.Nicearea(textarea, options);
		});
	},

	/**
	 * Event listener: Auto-toggle single checkbox on click on its container element
	 * Usage: Just be sure to write down the proper CSS rules, no JS code required
	 * if e107Admin.Helper#init is executed
	 *
	 * Example:
	 * <div class='autocheck'>
	 * 		<input type='checkbox' class='checkbox' />
	 * 		<div class='smalltext field-help'>Inline Help Text</div>
	 * </div>
	 * OR
	 * <td class='control'>
	 * 		<div class='auto-toggle-area autocheck'>
	 * 			<input class='checkbox' type='checkbox' />
	 *			<div class='smalltext field-help'>Inline Help Text</div>
	 *		</div>
	 * </td>
	 * Note: The important part are classes 'autocheck' and 'checkbox'.
	 * Container tagName is not important (everything is valid)
	 * 'auto-toggle-area' class should be defined by the admin theme
	 * to control the e.g. width of the auto-toggle clickable area
	 *
	 * Demo: e107_admin/image.php
	 *
	 */
	toggleChecked: function(event) {
		//do nothing if checkbox/form element or link is clicked
		var tmp = event.element().nodeName.toLowerCase();
		switch (tmp) {
			case 'input':
			case 'a':
			case 'select':
			case 'textarea':
			case 'radio':
			case 'label':
				return;
			break;
		}

		//checkbox container element
		var element = event.findElement('.autocheck'), check = null;
		if(element) {
			check = element.select('input.checkbox'); //search for checkbox
		}
		//toggle checked property
		if(check && check[0] && !($(check[0]).disabled)) {
			$(check[0]).checked = !($(check[0]).checked);
		}
	},

	/**
	 * Event listener
	 * Toggle all checkboxes in the current form, having name attribute value starting with 'multitoggle'
	 * by default or any value set by checkbox value (special command 'jstarget:start_with_selector')
	 * This method is auto-attached (if init() method is executed) to every checkbox having class toggle-all
	 *
	 * Example of valid checkbox being auto-observed:
	 * <input type='checkbox' class='toggle-all' name='not_important' value='jstarget:your_selector' />
	 *
	 * Demo: e107_admin/fla.php, e107_admin/db_verify.php
	 * Note: You could use e_form::checkbox_toggle() method (e107_handlers/form_handler.php),
	 * which produces multi-toggle checkbox observer in very convenient way
	 *
	 */
	allToggleChecked: function(event) {
		//event.stop();
		var form = event.element().up('form'), selector = 'multitoggle';

		if(form) {
			if(event.element().readAttribute('value').startsWith('jstarget:')) {
				selector = event.element().readAttribute('value').replace(/jstarget:/, '').strip();
			}
			form.toggleChecked(event.element().checked, 'name^=' + selector);
		}
	},

	/**
	 * Event listener
	 * Check all checkboxes in the current form, having name attribute value starting with 'multiaction'
	 * by default or any value set by button's value(special command 'jstarget:start_with_selector')
	 * This method is auto-attached to every button having name=check_all if init() method is executed
	 *
	 * Examples of valid inputbox markup:
	 * <input type='checkbox' class='checkbox' name='multiaction[]' />
	 * OR
	 * <input type='checkbox' class='checkbox' name='multiaction_something_else[]' />
	 * OR
	 * <input type='checkbox' class='checkbox' name='some_checkbox_array[]' /> (see the button example below)
	 * OR
	 * <input type='checkbox' class='checkbox' name='some_checkbox_array_some_more[]' /> (see the button example below)
	 *
	 * Example of button being auto-observed (see e107Admin.Helper#init)
	 * <button class='action' type='button' name='check_all' value='no-value'><span>Check All</span></button> // default selector - multiaction
	 * OR
	 * <button class='action' type='button' name='check_all' value='jstarget:some_checkbox_array'><span>Check All</span></button> // checkboxes names starting with - some_checkbox_array
	 *
	 * Demo: e107_admin/image.php, admin_log.php
	 *
	 */
	allChecked: function(event) {
		//event.stop();
		var form = event.element().up('form'), selector = 'multiaction';

		if(form) {
			if(event.element().readAttribute('value').startsWith('jstarget:')) {
				selector = event.element().readAttribute('value').replace(/jstarget:/, '').strip();
			}
			form.toggleChecked(true, 'name^=' + selector);
		}
	},

	/**
	 * Event listener
	 * Uncheck all checkboxes in the current form, having name attribute value starting with 'multiaction'
	 * by default or any value set by button's value(special command 'jstarget:start_with_selector')
	 * This method is auto-attached to every button having name=uncheck_all if init() method is executed
	 *
	 * Examples of valid inputbox markup:
	 * <input type='checkbox' class='checkbox' name='multiaction[]' />
	 * OR
	 * <input type='checkbox' class='checkbox' name='multiaction_something_else[]' />
	 * OR
	 * <input type='checkbox' class='checkbox' name='some_checkbox_array[]' /> (see the button example below)
	 * OR
	 * <input type='checkbox' class='checkbox' name='some_checkbox_array_some_more[]' /> (see the button example below)
	 *
	 * Example of button being auto-observed (see e107Admin.Helper#init)
	 * <button class='action' type='button' name='uncheck_all' value='no-value'><span>Uncheck All</span></button> // default selector - multiaction
	 * OR
	 * <button class='action' type='button' name='uncheck_all' value='jstarget:some_checkbox_array'><span>Uncheck All</span></button> // checkboxes names starting with - some_checkbox_array
	 *
	 * Demo: e107_admin/image.php, admin_log.php
	 *
	 */
	allUnchecked: function(event) {
		event.stop();
		var form = event.element().up('form'), selector = 'multiaction';
		if(event.element().readAttribute('value').startsWith('jstarget:')) {
			selector = event.element().readAttribute('value').replace(/jstarget:/, '').strip();
		}

		if(form) {
			form.toggleChecked(false, 'name^=' + selector);
		}
	}
}

if(e107Admin.initRules.Helper)
	e107.runOnLoad(e107Admin.Helper.init.bind(e107Admin.Helper), document, true);

/**
 * Admin Menu Class
 */
e107Admin.AdminMenu = {

	init: function(id, selection) {
		if(!id) {
			id = 'plugin-navigation';
			selection = $$('ul.plugin-navigation', 'ul.plugin-navigation-sub');
		}
		selection = $A(selection);

		if(this._track.get(id) || !selection) return false;

		this._track.set(id, selection);
		this.id = id;
		this.location = document.location.hash.substring(1);
		this.activeTab = null;
		this.activeBar = null;
		if(this.location) {
			replace = new RegExp(this.id.camelize() + 'AdminMenu=');
			this.activeTab = $(this.location.replace(replace, ''));
			if(this.activeTab) {
				this.activeTab.removeClassName('e-hideme').show();
			}
		}

		selection.each( function(element, i) {
			var check = element.select('a[href^=#]:not([href=#])');
			if(!this.activeTab) { //no page hash, set default
				if(check[0]) {
					this.switchTab(check[0].hash.substr(1), check[0], element);
				}
			} else if(!this.activeBar && this.activeTab) {//there is page hash, bar is unknown
				var h = this.activeTab.identify();
				var bar = check.find( function(el){
					return h == el.hash.substr(1);
				});
				this.switchTab(this.activeTab, bar, element);
			}
			check.invoke('observe', 'click', this.observer.bindAsEventListener(this, element));
		}.bind(this));

		//search for admin-menu forms
		$$('form.admin-menu').invoke('observe', 'submit', function(event) { var form = event.element(); action = form.readAttribute('action') + document.location.hash; form.writeAttribute('action', action) } );
		return true;
	},

	switchTab: function(show, bar, container) {
		show = $(show);
		if(!show) return false;
		if(this.activeTab && this.activeTab.identify() != show.identify()) {
			if(container) $(container).select('a.link-active[href^=#]').each(function (element) { element.removeClassName('link-active').addClassName('link'); element.up().removeClassName('active'); });
			this.activeTab.hide();
			this.activeTab = show;
			this.activeTab.removeClassName('e-hideme').show();
			if(bar) this.activeBar = bar;
			this.activeBar.removeClassName('link').addClassName('link-active');
			this.activeBar.up().addClassName('active');
			return true;
		} else if(!this.activeTab) { //init
			if(container) $(container).select('a.link-active[href^=#]').each(function (element) { element.removeClassName('link-active').addClassName('link'); element.up().removeClassName('active'); });
			this.activeTab = show.removeClassName('e-hideme').show();
			if(bar) this.activeBar = bar.removeClassName('link').addClassName('link-active');
			this.activeBar.up().addClassName('active');
			return true;
		} else if(!this.activeBar && this.activeTab) {//only bar is unknown
			if(container) $(container).select('a.link-active[href^=#]').each(function (element) { element.removeClassName('link-active').addClassName('link'); element.up().removeClassName('active'); });
			if(bar) this.activeBar = bar.removeClassName('link').addClassName('link-active');
			this.activeBar.up().addClassName('active');
			return true;
		}
		return false;
	},

	observer: function(event, cont) {
		if(this.switchTab(event.element().hash.substr(1), event.element(), cont)) {
			event.stop();
			document.location.hash = this.id.camelize() + 'AdminMenu=' + event.element().hash.substr(1);
		}
	},

	_track: $H()
}

// TEMPORARY HERE, awaiting the overall JS refactoring
/**
 * Auto resizeable textarea, max character counter (optional)
 * Inspired by user post on stackoverflow.com
 * TODO - make it e107 widget (or even part of BBArea widget?)
 * @param string|Element textarea
 * @param Object options
 */
e107Admin.Nicearea = Class.create({
	initialize: function(textarea, options)
  	{
		this.textarea = $(textarea);
		this.options = $H({
			'min_height' : 30,
			'max_height' : 400,
			'max_length' : null
		}).update(options);
		
		this.textarea.observe('keyup', this.refresh.bind(this));
		
		this._shadow = new Element('div').setStyle({
			lineHeight : this.textarea.getStyle('lineHeight'),
			fontSize : this.textarea.getStyle('fontSize'),
			fontFamily : this.textarea.getStyle('fontFamily'),
			position : 'absolute',
			top: '-10000px',
			left: '-10000px',
			width: this.textarea.getWidth() + 'px'
		});
		this.textarea.insert({ after: this._shadow });
		
		if(null !== this.options.get('max_length')) {
			this._remainingCharacters = new Element('p').addClassName('remainingCharacters');
			this.textarea.insert({before: this._remainingCharacters});  
		}
		this.refresh();  
	},

	refresh: function()
	{ 
		this._shadow.update($F(this.textarea).replace(/\n/g, '<br/>') + '<br/>');
		this.textarea.setStyle({
			height: Math.min(Math.max(parseInt(this._shadow.getHeight()) + parseInt(this.textarea.getStyle('lineHeight').replace('px', '')), this.options.get('min_height')), this.options.get('max_height')) + 'px'
		});
		
		if (null !== this.options.get('max_length')) {
			var remaining = this.options.get('max_length') - $F(this.textarea).length;
			if(!this.options.get('max_length')) this._remainingCharacters.update(Math.abs(remaining) + ' characters');
			else this._remainingCharacters.update(Math.abs(remaining) + ' characters ' + (remaining > 0 ? 'remaining' : 'over the limit'));
		}
	}
});

if(e107Admin.initRules.AdminMenu)
	document.observe( 'dom:loaded', function() { e107Admin.AdminMenu.init() });




// SecretR - FIXME - need general solution for admin UI tools + user autocomplete uses built-in Scripty Ajax.Autocompleter
//TODO find the right place for this and make generic - wanted it out of download plugin for now
// Current use:
// - filter text field must be in a form
// - form tag must have a class of e-filter-form
// - form must have an id of jstarget-xxx where xxx is the ID of the element to be replaced by the Ajax response
// - form action must be the URL to submit the Ajax request to
// - ajax requests posts 3 values:
//    - ajax_used = 1 - because of a current issue with e107Ajax.Updater
//    - filter_list=1 - to indicate to called URL that this is a filter list request
//    - the name/value of the st input field in the form, i.e. the one with the text to be searched for
e107.runOnLoad(function(){
   $$('form.e-filter-form').each(function(f) {
      var el = f.select('input')[0];
      el.e107PreviousValue = el.getValue();
   	el.observe('keyup', function(e) {
   	   var el = e.element();
   		e.stop();
   		if (el.getValue() != el.e107PreviousValue) {
   		   if (el.e107Timeout) {
   		      window.clearTimeout(el.e107Timeout);
   		   }
   		   el.e107PreviousValue = el.getValue();
   		   el.e107Timeout = window.setTimeout(function () {
   				new e107Ajax.Updater(f.id.replace(/jstarget-/, '').strip(), f.action, {
   					method: 'post',
   					parameters: 'ajax_used=1&filter_list=1&'+el.name+'='+el.getValue(),
   					overlayPage: $(document.body)
   				});
   	      }, 500);
   	   }
   	});
   });
}, document, false);
