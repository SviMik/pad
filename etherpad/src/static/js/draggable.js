/**
 * Copyright 2009 Google Inc.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


function makeDraggable(jqueryNodes, eventHandler) {
  jqueryNodes.each(function() {
    var node = $(this);
    var state = {};
    var inDrag = false;
    function dragStart(evt) {
      if (inDrag) {
        return;
      }
      inDrag = true;
      if (eventHandler('dragstart', evt, state) !== false) {
        $(document).bind('mousemove', dragUpdate);
        $(document).bind('mouseup', dragEnd);
      }
      evt.preventDefault();
      return false;
    }
    function dragUpdate(evt) {
      if (! inDrag) {
        return;
      }
      eventHandler('dragupdate', evt, state);
      evt.preventDefault();
      return false;
    }
    function dragEnd(evt) {
      if (! inDrag) {
        return;
      }
      inDrag = false;
      try {
        eventHandler('dragend', evt, state);
      }
      finally {
        $(document).unbind('mousemove', dragUpdate);
        $(document).unbind('mouseup', dragEnd);
        evt.preventDefault();
      }
      return false;
    }
    node.bind('mousedown', dragStart);
  });
}

function makeResizableVPane(top, sep, bottom, minTop, minBottom, callback) {
  if (minTop === undefined) minTop = 0;
  if (minBottom === undefined) minBottom = 0;

  makeDraggable($(sep), function(eType, evt, state) {
    if (eType == 'dragstart') {
      state.startY = evt.pageY;
      state.topHeight = $(top).height();
      state.bottomHeight = $(bottom).height();
      state.minTop = minTop;
      state.maxTop = (state.topHeight + state.bottomHeight) - minBottom;
    }
    else if (eType == 'dragupdate') {
      var change = evt.pageY - state.startY;

      var topHeight = state.topHeight + change;
      if (topHeight < state.minTop) { topHeight = state.minTop; }
      if (topHeight > state.maxTop) { topHeight = state.maxTop; }
      change = topHeight - state.topHeight;

      var bottomHeight = state.bottomHeight - change;
      var sepHeight = $(sep).height();

      var totalHeight = topHeight + sepHeight + bottomHeight;
      topHeight = 100.0 * topHeight / totalHeight;
      sepHeight = 100.0 * sepHeight / totalHeight;
      bottomHeight = 100.0 * bottomHeight / totalHeight;

      $(top).css('bottom', 'auto');
      $(top).css('height', topHeight + "%");
      $(sep).css('top', topHeight + "%");
      $(bottom).css('top', (topHeight +  sepHeight) + '%');
      $(bottom).css('height', 'auto');
      if (callback) callback();
    }
  });
}

function makeResizableHPane(left, sep, right, minLeft, minRight, sepWidth, sepOffset, callback) {
  if (minLeft === undefined) minLeft = 0;
  if (minRight === undefined) minRight = 0;
  if (sepOffset === undefined) sepOffset = 0;

  var initialState = {};
  var initialEvent = {pageX: $(sep).offset().left || 0};
  handleDragEvent('dragstart', initialEvent, initialState);
  handleDragEvent('dragend', initialEvent, initialState);
  makeDraggable($(sep), handleDragEvent);
  
  function handleDragEvent(eType, evt, state) {
    if (eType == 'dragstart') {
      state.startX = evt.pageX;
      state.leftWidth = $(left).width();
      state.rightWidth = $(right).width();
      state.minLeft = minLeft;
      state.maxLeft = (state.leftWidth + state.rightWidth) - minRight;
    } else if (eType == 'dragend' || eType == 'dragupdate') {
      var change = evt.pageX - state.startX;

      var leftWidth = state.leftWidth + change;
      if (leftWidth < state.minLeft) { leftWidth = state.minLeft; }
      if (leftWidth > state.maxLeft) { leftWidth = state.maxLeft; }
      change = leftWidth - state.leftWidth;

      var rightWidth = state.rightWidth - change;
      var newSepWidth = sepWidth;
      if (newSepWidth == undefined)
        newSepWidth = $(sep).width();

      var totalWidth = leftWidth + newSepWidth + rightWidth;
      var position = 100.0 * leftWidth / totalWidth;

      $(left).css('right', 'auto');
      $(left).css('width', position + '%');
      $(sep).css('left', position + '%');
      $(sep).css('margin-left', (sepOffset - 1) + 'px');
      $(right).css('left', position + '%');
      $(right).css('width', 'auto');
      $(right).css('margin-left', newSepWidth + 'px');
      if (callback) callback();
    }
  }
}
