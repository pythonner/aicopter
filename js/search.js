/* global instantsearch */

var search = instantsearch({
  appId: '3IMV4A54L6',
  apiKey: '14764fe83aec89f7335d3f2c85b21774',
  indexName: 'open_data',
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
      '<a href="{{{_highlightResult.Url.value}}}"><h4 class="media-heading">{{{_highlightResult.Name.value}}}</h4></a>' +
      '<p class="description">{{_highlightResult.Description.value}}</p>'+
      '<p class="year">{{_highlightResult.Year from.value}} to {{_highlightResult.Year to.value}}</p>'+
      '<p class="genre">'+
          '<span class="badge">{{_highlightResult.Host.value}}</span>&nbsp;'+
          '<span class="badge">{{_highlightResult.Format.value}}</span>&nbsp;'+
          '<span class="badge">{{_highlightResult.Domain.value}}</span>&nbsp;'+
          '<span class="badge">{{_highlightResult.License type.value}}</span>&nbsp;'+
      '</p>' +
    '</div>' +
  '</div>';

var noResultsTemplate =
  '<div class="text-center">No results found matching <strong>{{query}}</strong>.</div>';

search.addWidget(
  instantsearch.widgets.hits({
    container: '#hits',
    hitsPerPage: 5,
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
  instantsearch.widgets.refinementList({
    container: '#organizations',
    attributeName: 'Host',
    limit: 10,
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
    limit: 10,
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
    limit: 10,
    cssClasses: {
      list: 'nav nav-list',
      count: 'badge pull-right',
      active: 'active'
    }
  })
);

search.start();
