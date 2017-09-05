/* global instantsearch */

var search = instantsearch({
  appId: '3IMV4A54L6',
  apiKey: '14764fe83aec89f7335d3f2c85b21774',
  indexName: 'open_data_v3',
  urlSync: {}
});

search.addWidget(
  instantsearch.widgets.searchBox({
    container: '#q'
  })
);

search.addWidget(
  instantsearch.widgets.stats({
    container: '#stats'
  })
);

var hitTemplate =
  '<div class="hit media">' +
    '<div class="media-body">' +
      '<a href="{{Url}}"><h4 class="media-heading">{{{_highlightResult.Name.value}}}</h4></a>' +
      '<p class="description">{{{_highlightResult.Description.value}}}</p>'+
      '<p class="genre">'+
          '<span class="badge">by: {{{_highlightResult.Host.value}}}</span>&nbsp;'+
          '<span class="badge">{{{_highlightResult.Format.value}}}</span>&nbsp;'+
          '<span class="badge">{{{_highlightResult.Domain.value}}}</span>&nbsp;'+
      '</p>' +
    '</div>' +
  '</div>';

var noResultsTemplate =
  '<div class="text-center">No results found matching <strong>{{query}}</strong>.</div>';

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    hitsPerPage: 10,
    templates: {
      empty: noResultsTemplate,
      item: hitTemplate
    }

  })
);

search.addWidget(
  instantsearch.widgets.pagination({
    container: '#pagination',
    cssClasses: {
      root: 'pagination',
      active: 'active'
    }
  })
);

search.addWidget(
  instantsearch.widgets.rangeSlider({
    container: '#sizemb',
    attributeName: 'Size',
    min: 0,
    max: 100000,
    step: 1000,
    pips: false,
    tooltips: {format: function(rawValue) {return parseInt(rawValue)}},
    cssClasses: {
      body: 'nav-narrow'
    }    
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#organizations',
    attributeName: 'Host',
    limit: 5,
    showMore: true,
    cssClasses: {
      list: 'nav nav-list',
      count: 'badge pull-right',
      active: 'active'
    }
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#formats',
    attributeName: 'Format',
    limit: 5,
    showMore: true,
    cssClasses: {
      list: 'nav nav-list',
      count: 'badge pull-right',
      active: 'active'
    }
  })
);

search.addWidget(
  instantsearch.widgets.refinementList({
    container: '#domains',
    attributeName: 'Domain',
    limit: 5,
    showMore: true,
    cssClasses: {
      list: 'nav nav-list',
      count: 'badge pull-right',
      active: 'active'
    }
  })
);

search.start();
