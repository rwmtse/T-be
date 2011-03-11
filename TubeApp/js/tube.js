(function () {
	/** global flag to enable/disable debugging **/
	DEBUG = true;
	
	this.apptime = {
		"Tube" : function(authKey) {
			/*
			 * Private members
			 */
			var authKey_ = authKey ? authKey : '';
			// TODO developer should use their own key
			var developerKey_ = 'AI39si69Wbij78SJ860QpZvcHTbHrnwedus7dSqKRsNysIRpd_Ax3w2CoptBCAstJsruuUyxZ2PGMrMJx7_Zj2dSY-ahKkxdvQ';
			
			var activePage_ = [];
			
			var activeList_ = [];
			
			var getAuthRequestHeaders = function() {
				return {
					'Authorization' : 'GoogleLogin auth=' + authKey_,
					'X-GData-Key' : 'key=' + developerKey_
				};
			};
			
			var getVideoListItem = function(video, itemIndex) {		
				var thumb = document.createElement('img');
				$(thumb).attr('src', video.thumbnail.sqDefault);
				$(thumb).addClass('ui-li-thumb');
								
				var videoDirectLink = document.createElement('a');					
				$(videoDirectLink).attr('href', video.content["1"]);
				$(videoDirectLink).append(document.createTextNode(video.title));
				
				var detailLink = document.createElement('a');
				$(detailLink).attr('data-theme', 'c');
				$(detailLink).attr('href', 'video_detail.html?vid=' + video.id);
				$(detailLink).attr('rel', 'external');
				$(detailLink).append(document.createTextNode('Details'));
				
				var desc = document.createElement('p');
				$(desc).append(document.createTextNode(video.description));					
				
				var title = document.createElement('h3');
				$(title).append(videoDirectLink);	
				
				var uploader = document.createElement('span');
				$(uploader).append(document.createTextNode('by '));
				$(uploader).append(document.createTextNode(video.uploader));
				
				var separator = document.createElement('span');
				$(separator).append(document.createTextNode(' | '));
				
				var dateAdded = document.createElement('span');
				$(dateAdded).append(document.createTextNode(humaneDate(video.uploaded.replace(/\.\d{3}/g,''))));
				
				var viewCount = document.createElement('span');
				$(viewCount).append(document.createTextNode(addCommas(video.viewCount) + ' views'));
				
				var metadata = document.createElement('p');
				$(metadata).append(uploader).append(separator).append(dateAdded).append($(separator).clone()).append(viewCount);
				
				var li = document.createElement('li');
				
				// store item index as an attribute in the <li>			
				if (itemIndex) {
					$(li).attr('item-index', itemIndex);
				}
				
				$(li).append(thumb).append(title).append(desc).append(metadata).append(detailLink);
				$(li).addClass('ui-li-has-thumb');
						
				return li;
			};
			
			var getRelatedVideosFeed = function(vid) {
				var populateList = function(feedData) {
					var data = feedData.data;
					var total = data.totalItems;	
					var maxItemsPerPage = data.itemsPerPage;
					var startIndex = data.startIndex;
					
					$('ul li span').append(document.createTextNode(data.totalItems));
					
					// TODO: load more
					
					for ( var i = 0; i < data.items.length; i++) {
						var video = data.items[i];
									
						if (video.content && video.content["1"]) {
							$('#relatedvideos').append(getVideoListItem(video, startIndex + i));
						} else {
							// not available for mobile?
						}								
					}
					
					$('#relatedvideos').listview('refresh');
				};				
				
				if (DEBUG) {
					populateList(relatedVidData);
				} else {				
					$.ajax( {
						type : 'GET',
						url : apptime.Tube.URL.relatedVideos.replace('_vid_', vid),
						dataType : 'json',
						success : function(data, textStatus, jqXHR) {
							populateList(data);
						},
						error : function(xhr, type) {
							alert(type);
							alert(xhr.responseText);
						}
					});
				}
			};			
			
			var mapEntryToVideo = function(entry) {
				var fullIdPath = entry.id.$t.split('/');
				var title = entry.title.$t;
				var author = entry.author[0].name.$t; // TODO
				var rating = entry.gd$rating ? entry.gd$rating.average : 0;
				var contentLink = entry.media$group.media$content ? $.grep(entry.media$group.media$content, function(el){
					return (el.yt$format && el.yt$format == 1);
				}) : [];
				var thumbnail = entry.media$group.media$thumbnail[0].url; // TODO
				
				// empty array means video not available for mobile
				if (contentLink.length > 0) {
					var video = {
						'thumbnail' : { 'sqDefault' : thumbnail },
						'content' : { '1' : contentLink[0].url },
						'id' : fullIdPath[fullIdPath.length - 1],
						'title' : title,
						'description' : entry.media$group.media$description.$t,
						'uploader' : author,
						'uploaded' : entry.published.$t,
						'viewCount' : entry.yt$statistics ? entry.yt$statistics.viewCount : 0
					};
					
					return video;
				}
				
				return null;
			};
			
			var getLoadMoreButton = function() {
				var button = document.createElement('input');
				$(button).attr('type', 'button');
				$(button).attr('value', 'Load More');
				$(button).click(function(){
					//apptime.Tube.getInstance().loadMore();
					tube.loadMore();
				});
				
				return button;
			};
			
			var populateList = function(feedData, requestUrl) {
				var data = feedData.data;
				var total = data.totalItems;

				var maxItemsPerPage = data.itemsPerPage;
				var startIndex = data.startIndex;
				var list = activeList_; //$('[data-role=listview]:visible');
				
				// store request URL as an attribute in <ul>
				$(list).attr('request-url', requestUrl);
				
				for (var i = 0; i < data.items.length; i++) {
					var video = data.items[i];
					
					if (!video.content && video.video.content) {
						video = video.video;
					}					
					
					if (video.content["1"]) {
						// TODO bug, keep appending... repeating entries
						$(list).append(getVideoListItem(video, i + startIndex));
					} else {
						// not available for mobile?							
					}												
				}
				
				// show "Load More" if there are more items to show
				if (total > data.items.length + startIndex) {
					$(list).append(getLoadMoreButton());
				}
				
				$(list).listview('refresh');
				$(activePage_).page('destroy').page();
			};
			
			/*
			 * Public members
			 */
			this.search = function(searchTerm) {
				var requestUrl = apptime.Tube.URL.search + searchTerm;
				
				if (DEBUG) {
					populateList(searchData, requestUrl);
				} else {
					$.ajax({
						type : 'GET',
						url : requestUrl,
						dataType : 'json',
						success : function(data, textStatus, jqXHR) {
							populateList(data, requestUrl);
						},
						error : function(xhr, type) {						
						}
					});
				}
			};
			
			this.getFavoritesFeed = function() {
				var requestUrl = apptime.Tube.URL.favorites;		
				
				if (DEBUG) {
					populateList(favData, requestUrl);
				} else {				
					$.ajax( {
						type : 'GET',
						url : requestUrl,
						dataType : 'json',
						headers : getAuthRequestHeaders(),
						success : function(data, textStatus, jqXHR) {
							populateList(data, requestUrl);
						},
						error : function(xhr, type) {
							alert(type);
							alert(xhr.responseText);
						}
					});
				}
			};
			
			this.getVideoDetail = function() {
				var vid = getParameterByName('vid');
				
				$.ajax( {
					type : 'GET',
					url : apptime.Tube.URL.videoDetail.replace('_vid_', vid),
					dataType : 'json',
					success : function(data, textStatus, jqXHR) {
						var video = data.data;
						$('div h1').append(document.createTextNode(video.title));
						
						var img = document.createElement('img');
						$(img).attr('src', video.thumbnail.sqDefault);
						
						var span = document.createElement('span');
						$(span).addClass('ui-li-aside');
							
						var uploaded = document.createElement('strong');
						$(uploaded).append(document.createTextNode(humaneDate(video.uploaded.replace(/\.\d{3}/g,''))));
						var br = document.createElement('br');
						
						var uploader = document.createElement('span');
						$(uploader).append(document.createTextNode(video.uploader));
						
						var star = document.createElement('img');
						$(star).attr('src', 'icons/star_full.png');
						
						var like = document.createElement('a');
						$(like).attr('href', '#');
						$(like).attr('data-icon', 'check');
						$(like).attr('data-iconpos', 'notext');
						$(like).attr('data-role', 'button');
						$(like).append(document.createTextNode('Like'));
				
						var dislike = document.createElement('a');
						$(dislike).attr('href', '#');
						$(dislike).attr('data-icon', 'delete');
						$(dislike).attr('data-iconpos', 'notext');
						$(dislike).attr('data-role', 'button');
						$(dislike).append(document.createTextNode('Dislike'));
							
						$(span).append(uploaded).append(br).append(uploader).append($(br).clone()).append(like).append(dislike);
						
						var desc = document.createElement('p');
						$(desc).append(document.createTextNode(video.description));
						
						var fieldset = document.createElement('fieldset');
						$(fieldset).addClass('ui-grid-a');
						
						var playDiv = document.createElement('div');
						$(playDiv).addClass('ui-block-a');
						var playButton = document.createElement('a'); //document.createElement('button');
						//$(playButton).attr('type', 'submit');
						$(playButton).attr('href',video.content['1']);
						$(playButton).attr('data-role', 'button');
						$(playButton).append(document.createTextNode('Play'));
						$(playDiv).append(playButton);
						
						var shareDiv = document.createElement('div');
						$(shareDiv).addClass('ui-block-b');
						var shareButton = document.createElement('button');
						$(shareButton).attr('type', 'submit');
						$(shareButton).append(document.createTextNode('Share'));
						$(shareDiv).append(shareButton);
						
						$(fieldset).append(playDiv).append(shareDiv);
						
						$('#details').append(img).append(span).append(desc).append(fieldset);						
						
						// make sure dynamic elements get proper styles
						$('#videodetails').page('destroy').page();
						
						getRelatedVideosFeed(vid);
					},
					error : function(xhr, type) {
						alert(type);
						alert(xhr.responseText);
					}
				});			
			};
			
			this.login = function(username, password, redirect) {
				if (!username || !password) {
					return;
				}
				
				alert('login=' + username + ',' + password);

				$.ajax( {
					url : apptime.Tube.URL.login,
					global : false,
					type : 'POST',
					data : 'Email=' + username + '&Passwd=' + password
							+ '&service=youtube&source=TestLogin',
					dataType : 'text',
					success : function(data, textStatus, jqXHR) {
						alert(jqXHR.responseText);
						var AUTH = 'Auth=';
						var index = jqXHR.responseText.indexOf(AUTH);
						authKey_ = jqXHR.responseText.substring(index + AUTH.length, jqXHR.responseText.length - 1);			
						createCookie('Tube.authKey', authKey_, 7); // TODO: store key for 7 days
						alert('authKey=' + authKey_);
						
						if (!redirect) {
							redirect = '#main';
						}
						
						alert('redirect=' + redirect);
						
						// redirect to destination page
						$.mobile.changePage(redirect);
					},
					error : function(jqXHR, textStatus, errorThrown) {
						alert("login failed, error=" + errorThrown);
					}
				});
			};
			
			this.getNewSubscriptionVideos = function(channel) {
				// filter results by channel
				// TODO: UI to choose between all new videos or by channel
				var populateList = function(data, listId) {
					var feed = data.feed;
					var total = feed.openSearch$totalResults.$t;
					var startIndex = feed.openSearch$startIndex.$t;
					
					for (var i = 0; i < feed.entry.length; i++) {
						var entry = feed.entry[i];
						var video = mapEntryToVideo(entry);
						// null means video not available for mobile
						if (video != null) {							
							$('#' + listId).append(getVideoListItem(video, startIndex + i));
						}
					}
					
					$('#' + listId).listview('refresh');
					
					if (listId == 'channelvideos') {								
						$('div h1').append(document.createTextNode(channel + '\'s latest videos'));
						$('#subscriptions_channel').page('destroy').page();
					}
				};
				
				var feedURL = apptime.Tube.URL.newSubscriptions;
				
				if (channel) {
					feedURL = '&author=' + channel;
				}
				
				if (DEBUG) {
					populateList(channel ? channelSubVidData : newSubsData, channel ? 'channelvideos' : 'newvideos');
				} else {
					$.ajax({
						type : 'GET',
						url : feedURL,
						dataType : 'json',
						headers : getAuthRequestHeaders(),
						success : function(data, textStatus, jqXHR) {							
							populateList(data, channel ? 'channelvideos' : 'newvideos');														
						},
						error : function(xhr, type) {
							alert(type);
							alert(xhr.responseText);
						}
					});
				}				
			};
			
			this.getSubscribedChannels = function() {
				var populateList = function(data) {
					var feed = data.feed;
					var total = feed.openSearch$totalResults.$t;
					
					for (var i = 0; i < feed.entry.length; i++) {
						var entry = feed.entry[i];
						var username = entry.yt$username.$t;						

						var link = document.createElement('a');
						$(link).attr('href', 'subscriptions_channel.html?author=' + username);
						$(link).attr('rel', 'external');
						$(link).append(document.createTextNode(username));
						
						var item = document.createElement('li');
						$(item).append(link);
						
						$('#channels').append(item);
					}
					
					$('#channels').listview('refresh');					
				};
				
				if (DEBUG) {
					populateList(subChannelData);
				} else {
					$.ajax({
						type : 'GET',
						url : apptime.Tube.URL.subscriptions,
						dataType : 'json',
						headers : getAuthRequestHeaders(),
						success : function(data, textStatus, jqXHR) {		
							populateList(data);							     
						},
						error : function(xhr, type) {
							alert(type);
							alert(xhr.responseText);
						}
					});
				}
			};
			
			this.getSubscriptions = function() {				
				var listid = getParameterByName('listid');
				
				if (listid != '') {
					if ($('#' + listid).hasClass('hide')) {
						// show listid
						$('#' + listid).removeClass('hide');						
						// hide the other list
						$.grep($('[data-role=listview]'), function(el) {
							if ($(el).attr('id') != listid && !$(el).hasClass('hide')) {
								$(el).addClass('hide');
							}
						});
						
						// highlight tab
						$('span[tabid="' + listid + '"]').addClass('current');
						// unhighlight other tab
						$('span[tabid!="' + listid + '"]').removeClass('current');
						$('#subscriptions').page('destroy').page();
					}					
				}
				
				this.getNewSubscriptionVideos();
				this.getSubscribedChannels();				
			};
			
			this.loadMore = function() {
				// list state info can be stored as attributes in the <ul>, e.g. request URL
				// item index can be stored as an attribute in each <li>
				// to get the last item index, get the last <li> and inspect the value of the attribute
				// figure out what the start-index should be (based on last item index), and send request
				var list = activeList_; //$('[data-role=listview]:visible');
				var lastItem = $(list).find('li:last'); //$('[data-role=listview]:visible li:last');
				var requestUrl = $(list).attr('request-url');
				var lastItemIndex = parseInt($(lastItem).attr('item-index'));				
				var containsStartIndex = (requestUrl.indexOf('start-index') != -1);
				
				if (!containsStartIndex) {
					requestUrl += '&start-index=' + (lastItemIndex + 1); 
				} else {
					requestUrl = requestUrl.replace(/start-index=\d+/, 'start-index=' + (lastItemIndex + 1));
				}
			};
			
			this.setActivePage = function(page) {
				activePage_ = page;
				
				if (page) {
					this.setActiveList($(page).find('[data-role=listview]'));
				}
			};
			
			this.setActiveList = function(list) {
				activeList_ = list;
			};
		}
	};	
				
	this.apptime.Tube.getInstance = function() {
		var tube = null;				
		var authKey = readCookie('Tube.authKey');
		
		if (authKey) {
			tube = new apptime.Tube(authKey);
		} else {
			tube = new apptime.Tube();
		}
			
		return tube;
	};
	
	this.apptime.Tube.URL = {};
	this.apptime.Tube.URL.__defineGetter__('login', function() { return 'https://www.google.com/accounts/ClientLogin'; });
	this.apptime.Tube.URL.__defineGetter__('favorites', function() { return 'http://gdata.youtube.com/feeds/api/users/default/favorites?v=2&alt=jsonc'; });
	this.apptime.Tube.URL.__defineGetter__('subscriptions', function() { return 'http://gdata.youtube.com/feeds/api/users/default/subscriptions?v=2&alt=json'; });
	this.apptime.Tube.URL.__defineGetter__('newSubscriptions', function() { return 'http://gdata.youtube.com/feeds/api/users/default/newsubscriptionvideos?alt=json'; });
	this.apptime.Tube.URL.__defineGetter__('playlists', function() { return 'http://gdata.youtube.com/feeds/api/users/default/playlists?v=2&alt=jsonc'; });
	/*
	 * search term to be filled in
	 */
	this.apptime.Tube.URL.__defineGetter__('search', function() { return 'http://gdata.youtube.com/feeds/api/videos?v=2&alt=jsonc&q='; });
	/*
	 * _vid_ should be actual video id
	 */	
	this.apptime.Tube.URL.__defineGetter__('videoDetail', function() { return 'http://gdata.youtube.com/feeds/api/videos/_vid_?v=2&alt=jsonc'; });
	/*
	 * _vid_ should be actual video id
	 */	
	this.apptime.Tube.URL.__defineGetter__('relatedVideos', function() { return 'http://gdata.youtube.com/feeds/api/videos/_vid_/related?v=2&alt=jsonc'; });
	
	this.apptime.Tube.URL_SHARE = {};
	this.apptime.Tube.URL_SHARE.__defineGetter__('facebook', function() { return 'http://m.facebook.com/sharer.php'; });
})();