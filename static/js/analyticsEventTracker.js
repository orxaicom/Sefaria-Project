const AnalyticsEventTracker = (function() {
    const VALID_ANALYTICS_FIELDS = new Set([
        'project', 'panel_type', 'panel_number', 'item_id', 'version', 'content_lang',
        'content_id', 'content_type', 'panel_name', 'panel_category', 'position', 'ai',
        'text', 'experiment', 'feature_name', 'from', 'to', 'action', 'engagement_value',
        'engagement_type', 'logged_in', 'site_lang', 'traffic_type',
    ]);
    const EVENT_ATTR = 'data-anl-event';
    const FIELD_ATTR_PREFIX = 'data-anl-';
    const BATCH_ATTR = 'data-anl-batch';

    function _isValidAnalyticsObject(obj) {
        const invalid_keys = Object.keys(obj).filter(
            key => !VALID_ANALYTICS_FIELDS.has(key)
        );
        if (invalid_keys.length > 0) {
            for (let key of invalid_keys) {
                console.warn("Invalid analytics key:", key);
            }
            return false;
        }
        return true;
    }

    function _parseEventAttr(value) {
        /**
         * the value of `data-anl-event` is of the form `<event name>:<event type>`
         * Returns this data parsed into an object
         */
        if (!value) {
            return {name: "", type: ""};
        }
        const [eventName, eventType] = value.split(':');
        if (!eventName?.length) {
            console.warn("Event name is invalid for `data-anl-event` value:", value);
        }
        if (!eventType?.length) {
            console.warn("Event type is invalid for `data-anl-event` value:", value);
        }
        return {name:eventName, type:eventType};
    }

    function _getEventTargetByCondition(event, condition, eventTarget=null) {
        /**
         * Searches the parents of an event target for an element to meets a certain condition
         * `condition` is a function of form condition(element) => bool.
         * If `eventTarget` is passed, it will be used as the starting point of the search instead of `event.target`
         * Returns the first element in parent hierarchy where `condition` returns true
         * If no element returns true, returns null.
         */
        let parent = eventTarget || event.target;
        const outmost = event.currentTarget;
        while (parent) {
            if(condition(parent)){
                return parent
            }
            else if (parent.parentNode === outmost) {
                return null;
            }
            parent = parent.parentNode;
        }
    }

    function _getAnalyticsEvent(event) {
        /**
         * Return an object of form {name, type} if this JS event should be treated as an analytics event
         * Looks for a parent of e.target that has the attribute `data-anl-event`
         * If this JS event doesn't match a registered analytics event, return `null`
         */
        const element = _getEventTargetByCondition(
            event,
            element => {
                const value = element.getAttribute(EVENT_ATTR);
                return _parseEventAttr(value).type === event.type;
            }
        );
        if (!element) { return null; }
        return _parseEventAttr(element.getAttribute(EVENT_ATTR));
    }

    function _getAnlDataFromElement(element) {
        if (!element) { return {}; }
        return Array.from(element.attributes).reduce((attrsAggregated, currAttr) => {
            const attrName = currAttr.name;
            if (attrName === EVENT_ATTR) {

            } else if (attrName.startsWith(FIELD_ATTR_PREFIX)) {
                if (attrName === BATCH_ATTR) {
                    attrsAggregated = {...attrsAggregated, ...JSON.parse(currAttr.value)};
                } else {
                    const anlFieldName = attrName.replace(FIELD_ATTR_PREFIX, '');
                    attrsAggregated[anlFieldName] = currAttr.value;
                }
            }
            return attrsAggregated;
        }, {});
    }

    function _mergeObjectsWithoutOverwrite(a, b) {
        /**
         * merges a into b but doesn't overwrite fields in b that already exist
         */
        for (let key in a) {
            if (!(key in b)) {
                b[key] = a[key];
            }
        }
        return b;
    }

    function _handleAnalyticsEvent(event) {
        const anlEvent = _getAnalyticsEvent(event);
        if (!anlEvent) { return; }
        let anlEventData = {};
        let currElem = null;
        do {
            currElem = _getEventTargetByCondition(
                event,
                element => Object.keys(_getAnlDataFromElement(element)).length > 0,
                currElem?.parentNode
            );
            const currAnlEventData = _getAnlDataFromElement(currElem);
            // make sure that analytics fields that are defined lower down aren't overwritten by ones defined higher in the DOM tree
            anlEventData = _mergeObjectsWithoutOverwrite(currAnlEventData, anlEventData);
        } while (currElem?.parentNode);

        if (!_isValidAnalyticsObject(anlEventData)) { return; }

        gtag("event", anlEvent.name, anlEventData);
    }

    /**
     * Public interface is in return value
     */
    return {
        attach: function(selector, eventTypes) {
            /**
             * Listens for analytics events on any element that matches `selector`.
             * `eventTypes` is a list of JS event types to listen for
             * Any element that is a child of `selector` that has the `data-anl-event` attribute will trigger
             * an analytics event. The event type needs to be in `eventTypes` and needs to match the value of `data-anl-event`
             * E.g. if a child of selector is <div data-anl-event="click">...</div>, any click on this div will trigger an
             * analytics event
             * The data sent for the event is aggregated from all `data-anl-<field>` attributes on any parent of the event
             * target (including the target itself). `<field>` needs to be a valid analytics field as specified in
             * `VALID_ANALYTICS_FIELDS` above.
             */
            const elements = document.querySelectorAll(selector);

            for (let eventType of eventTypes) {
                elements.forEach(element => {
                    element.addEventListener(eventType, _handleAnalyticsEvent);
                });
            }
        }
    };
})();
