var GH_API_URI = "http://vps.mozilla-tunisia.org:5000/";

var REPOS_PER_ROW = 3;

$(document).ready(function() {
  fetchGhData();
});


function fetchGhData() {
  $.getJSON(GH_API_URI,
  function(result) {
    addRepos(result.repos);
    updateMembers(result.members);
  }).fail(function(xhr, textStatus, error) {
      console.log(error);
      $("#loading").addClass("networkError").text("An error occurred while communicating with our servers.");
      if (xhr.responseJSON && xhr.responseJSON["message"]) {
        $("<div>").text("(" + xhr.responseJSON["message"] + ")").appendTo($("#loading"));
      }
      $("#fallback").removeClass("hidden");
   });
}


function getSortedLeaders(repos) {

  var leaders = {};
  $.each(repos, function (i, repo) {
    $.getJSON(repo.contributors_url, function(results) {
      $.each(results, function(i, result) {
        if( leaders[result.login] ) {
          leaders[result.login] += result.contributions;
        }else {
          leaders[result.login] = result.contributions;
        }
       }); // each
    });
  });

  var sortableLeaders = [];
  for( var l in leaders ) {
    sortableLeaders.push([l, leaders[l]]);
  }

  console.log("SortedLeaders");
  console.log(sortableLeaders);
  sortableLeaders.sort(function(a,b) { return b[1] - a[1]; });
  return  sortableLeaders;

}

function addRecentlyUpdatedRepo(repo) {
  var $item = $("<li>");
  var $name = $("<a>").attr("href", repo.html_url).text(repo.name);
  $item.append($("<span>").addClass("name").append($name));
  var $time = $("<a>").attr("href", repo.html_url + "/commits").text(strftime("%h %e, %Y", repo.pushed_at));
  $item.append($("<span>").addClass("time").append($time));
  $item.append('<span class="bullet">&sdot;</span>');
  var $watchers = $("<a>").attr("href", repo.html_url + "/watchers").text(repo.watchers + " stargazers");
  $item.append($("<span>").addClass("watchers").append($watchers));
  $item.append('<span class="bullet">&sdot;</span>');
  var $forks = $("<a>").attr("href", repo.html_url + "/network").text(repo.forks + " forks");
  $item.append($("<span>").addClass("forks").append($forks));
  $item.appendTo("#recently-updated-repos");
}

function addRepos(repos) {
  var starWeight = 9; // repo watchers
  var forkWeight = 3; // forks of the repo
  var giltWeight = 1000000;  // if the gilt repo is actually a fork

  repos = repos.filter(Filter);

  // Sort weight priority: gilt repo, starred, watched, activity
  $.each(repos, function(i,repo) { // assign weights
    var weight =
      (repo.stargazers_count * starWeight) +
      (repo.forks_count * forkWeight) +
      (!repo.fork * giltWeight);
    repo["gilt_weight"] = weight;
  });

  repos = repos.sort(function(a,b) {
    var aw = a["gilt_weight"];
    var bw = b["gilt_weight"];
    if (aw == bw) {
      return 0;
    } else if (aw < bw) {
      return 1;
    }
    else {
      return -1;
    }
  });

  $("#loading").addClass("hidden");

  $.each(repos, function(i,repo) {
    addRepo(i, repo);
  });

  // show repo stats
  var stats = $("#repo-stats");
  $("<a>").attr("href", "https://github.com/moztn").text(repos.length).appendTo(stats);
  stats.removeClass("hidden");

  var leaders = getSortedLeaders(repos);
  console.log(leaders);

}


function Filter(repo) {
  return !(repo.description.contains("[ARCHIVED]") ||
         repo.description.contains("[PRESENTATION]"));
}

function addRepo(i, repo) {
  var row = $("#all-repos").children().last();
  if (! row || i % REPOS_PER_ROW == 0) {
    row = $("<div>").addClass("repo-row row-fluid");
    row.appendTo("#all-repos");
  }

  var r = $("<div>").addClass("repo span4");
  var a = $("<a>").attr("href", repo.html_url).appendTo(r);

  $("<i>").addClass("icon-star repo-icon").appendTo(a);
  $("<span>").addClass("count").text(repo.watchers_count).appendTo(a);

  $("<i>").addClass("icon-code-fork repo-icon").appendTo(a);
  $("<span>").addClass("count").text(repo.forks_count).appendTo(a);

  $("<i>").addClass("fa fa-exclamation-circle  repo-icon").appendTo(a);
  $("<span>").addClass("count").text(repo.open_issues_count).appendTo(a);


  if (repo.private) {
    $("<i>").addClass("icon-lock").appendTo(a);
  }
  $("<h4>").addClass("name").text(repo.name).appendTo(a);
  $("<p>").addClass("description").text(repo.description).appendTo(a);
      
      var languages = repo.lang;
     
      $.each(languages, function(i, lang) {
        $("<span>").addClass("label " + lang.toLowerCase()).text(lang).appendTo(a);
      });

  r.appendTo(row);
}

function updateMembers(aMembersList) {
    if (aMembersList && aMembersList.length > 0) {
      var stats = $("#member-stats");
      $("<a>").attr("href", "https://github.com/moztn?tab=members").text(aMembersList.length).appendTo(stats);
      stats.removeClass("hidden");
      $("#repo-stats").addClass("repo-stats-inline");
    }
}
