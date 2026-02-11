import request from '@/utils/request'

// 查询耗材产品列表
export function listMaterial(query) {
  return request({
    url: '/foundation/material/list',
    method: 'get',
    params: query
  })
}

// 查询所有耗材产品列表
export function listMaterialAll(query) {
  return request({
    url: '/foundation/material/listAll',
    method: 'get',
    params: query
  })
}

// 查询耗材产品详细
export function getMaterial(id) {
  return request({
    url: '/foundation/material/' + id,
    method: 'get'
  })
}

// 新增耗材产品
export function addMaterial(data) {
  return request({
    url: '/foundation/material',
    method: 'post',
    data: data
  })
}

// 修改耗材产品
export function updateMaterial(data) {
  return request({
    url: '/foundation/material',
    method: 'put',
    data: data
  })
}

// 删除耗材产品
export function delMaterial(id) {
  return request({
    url: '/foundation/material/' + id,
    method: 'delete'
  })
}

// 推送档案
export function pushMaterialArchive(supplierId) {
  return request({
    url: '/foundation/material/pushArchive',
    method: 'post',
    data: {
      supplierId: supplierId
    }
  })
}

// 批量更新耗材产品名称简码
export function updateMaterialReferred(ids) {
  return request({
    url: '/foundation/material/updateReferred',
    method: 'post',
    data: { ids }
  })
}

export function sleft(str,x){
		if(str){
			return str.slice(0,x);
		}else
			return '';
	}
export function sright(str,x){
		if(str) {
			return str.slice(-x);
		}else
			return '';
	}

//解析辅条码
export function jxFtm(as_tmh){
  			var _ftm={};
  			if(as_tmh.length<8){
  				_ftm.ph=as_tmh;
  				_ftm.yxq="";
  				_ftm.ftm=as_tmh;
  				return _ftm;
  			}
  		  	var ls_return_ftm,ls_return_ph = "",ls_yxq,Is_ph,Is_flag,ls_temp_tmh;
  			var Idt_return_yxq = "2030-01-01";
  			as_tmh=as_tmh.replace(/[(|)|（|）/]/g, "");
  			ls_return_ftm=as_tmh.trim();

  			if ("11"==sleft(ls_return_ftm,2) || "13"==sleft(ls_return_ftm,2)){

  					_ftm.scrq="20"+sleft(sright(sleft(ls_return_ftm,8),6),2)+"-"+(sright(sleft(ls_return_ftm,8),6).substring(2,4)+"-"+sright(sright(sleft(ls_return_ftm,8),6),2));
  					ls_return_ftm=sright(ls_return_ftm,ls_return_ftm.length -8)
  			}else {
  				//_ftm.scrq = new Date();
  				_ftm.scrq="";//new Date()
  			}
  			var li_len=ls_return_ftm.length;
  			if (sleft(ls_return_ftm,2)=='17' || sleft(ls_return_ftm,2)=='15' ){//|| sleft(ls_return_ftm,2)==("21")
  				ls_yxq=sleft(ls_return_ftm,8); //根据辅条码解析有效期
  				if (sright(ls_yxq,2)==("00")){
  					Idt_return_yxq = "20"+sleft(sright(ls_yxq,6),2)+"-"+(sright(ls_yxq,6).substring(2,4))+"-28";
  				}
  				else{
  					Idt_return_yxq="20"+sleft(sright(ls_yxq,6),2)+"-"+(sright(ls_yxq,6).substring(2,4))+"-"+sright(sright(ls_yxq,6),2);
  				}
  				if(sright(sleft(as_tmh,10),2)=='11'){
  					_ftm.scrq="20"+sleft(sright(sleft(ls_return_ftm,16),6),2)+"-"+(sright(sleft(ls_return_ftm,16),6).substring(2,4)+"-"+sright(sright(sleft(ls_return_ftm,16),6),2));
  					ls_return_ftm=sright(ls_return_ftm,ls_return_ftm.length -8)
  				}
  				//根据辅条码解析批号
  				if(!compareDate(Idt_return_yxq,'1900-01-01')){
  					ls_yxq=sleft(ls_return_ftm,10)
  					Idt_return_yxq="20"+sleft(sright(ls_yxq,6),2)+"-"+(sright(ls_yxq,6).substring(2,4))+"-"+sright(sright(ls_yxq,6),2);
  					Is_ph=sright(ls_return_ftm,li_len - 10)
  				}else{
  				    Is_ph=sright(ls_return_ftm,li_len -8)
  			    }
  				Is_flag=sleft(Is_ph,2);

  				if(Is_flag == '11'){
  					if(Is_ph.length <= 10){
  						Is_ph = sright(Is_ph,Is_ph.length-1)
  					}else{
  						Is_ph = sright(Is_ph,Is_ph.length-8)
  					}
  					Is_flag = sleft(Is_ph,2)
  				}


  				if ("10"==(Is_flag )){
  						if(Is_ph.length>12){
  								if( sright(sleft(Is_ph,Is_ph.length-3),2)==("91")||sright(sleft(Is_ph,Is_ph.length-3),2)==("21")){
  									ls_return_ph=sright(sleft(Is_ph,Is_ph.length-5),(sleft(Is_ph,Is_ph.length-5)).length-2);
  								}else if(sright(sleft(Is_ph,Is_ph.length-4),2)==("91")||sright(sleft(Is_ph,Is_ph.length-4),2)==("21")){
  									ls_return_ph=sright(sleft(Is_ph,Is_ph.length-6),(sleft(Is_ph,Is_ph.length-6)).length-2);
  									if(sleft(sright(Is_ph,6),2)=='21'){
  										ls_return_ph=sright(sleft(Is_ph,Is_ph.length-6),(sleft(Is_ph,Is_ph.length-6)).length-2)+'-'+sright(Is_ph,6).substring(2);
  									}else{
  										ls_return_ph=sright(sleft(Is_ph,Is_ph.length-6),(sleft(Is_ph,Is_ph.length-6)).length-2);
  									}

  								}else if(sright(sleft(Is_ph,13),2) == '21'){
  									//ls_return_ph = sright(sleft(Is_ph,11),9);
  									ls_return_ph = sright(sleft(Is_ph,11),9)+"-"+Is_ph.substring(13);
  								}else if(sright(sleft(Is_ph,12),2) == '21'){
  									//ls_return_ph = sright(sleft(Is_ph,10),8);
  									ls_return_ph = sright(sleft(Is_ph,10),8)+"-"+Is_ph.substring(12);
  								}else{
  									ls_return_ph=sright(Is_ph,Is_ph.length-2);

  								}
  						}else{
  							ls_return_ph=sright(Is_ph,Is_ph.length-2);
  						}
  				}else if("21"==(Is_flag )){
  					if(Is_ph.length >= 30){
  						ls_return_ph = sright(Is_ph,10)
  					}else{
  						ls_return_ph = sright(Is_ph,Is_ph.length-2)
  					}
  				}else if("13"==(Is_flag )){
  					_ftm.scrq = '20'+sleft(sright(sleft(Is_ph,8),6),2)+'-'+sright(sleft(Is_ph,8),6).substring(2,4)+'-'+sright(sright(sleft(Is_ph,8),6),2);
  					ls_return_ftm = sright(Is_ph,Is_ph.length -8);
  					ls_return_ph = sright(ls_return_ftm,li_len-2);
  				}
  				else if("30"==(Is_flag )){
  					if(sright(sleft(Is_ph,5),2)==("10") && (sleft(Is_ph,5).substring(2,3)).isNumeric()){
  						ls_return_ph=sright(Is_ph,Is_ph.length-5);
  					}else if(sright(sleft(Is_ph,6),2)==("10") && (sleft(Is_ph,6).substring(2,4)).isNumeric()){
  						ls_return_ph=sright(Is_ph,Is_ph.length-6);
  					}else if(sright(sleft(Is_ph,7),2)==("10") && (sleft(Is_ph,7).substring(2,5)).isNumeric()){
  						ls_return_ph=sright(Is_ph,Is_ph.length-7);
  					}else{
  						ls_return_ph="";
  					}
  				}else{
  					if(sleft(Is_flag,1)==''){
  						ls_return_ph = sright(Is_ph,Is_ph.length-1)
  					}else{
  						ls_return_ph = ''
  					}
  				}
  			}else if(sleft(ls_return_ftm,4) == '*+$$'){
  				Idt_return_yxq = '20'+ls_return_ftm.substring(9,11)+'-'+ls_return_ftm.substring(7,9)+'-28'
  				ls_return_ph = ls_return_ftm.substring(11,24)
  			}else if(sleft(ls_return_ftm,1)=='+'){
  				if(sleft(ls_return_ftm,3)=='+$$'){
  					if(sleft(ls_return_ftm,4)!='+$$0'&&sleft(ls_return_ftm,4)!='+$$1'&&sleft(ls_return_ftm,4)!='+$$2'){
  						if(sleft(ls_return_ftm,7)=='+$$9000'){
  							if(ls_return_ftm.substring(9,10)!='0'&&ls_return_ftm.substring(9,10)!='1'){
  								Idt_return_yxq=getDateByDay(parseInt(ls_return_ftm.substring(12,15))-1,"20"+ls_return_ftm.substring(10,12)+"-01-01");
  								ls_return_ph = sleft(sright(ls_return_ftm,li_len-15),(sright(ls_return_ftm,li_len-15)).length-2);
  							}else{
  								if(ls_return_ftm.substring(7,9)!='00'){
  									Idt_return_yxq = '20'+ls_return_ftm.substring(11,13)+'-'+ls_return_ftm.substring(9,11)+'-'+ls_return_ftm.substring(8,2);
  								}else{
  									Idt_return_yxq = '20'+ls_return_ftm.substring(11,13)+'-'+ls_return_ftm.substring(9,11)+'-'+'28';
  								}
  								ls_return_ph = sleft(sright(ls_return_ftm,li_len-13),sleft(sright(ls_return_ftm,li_len-13))-2);
  							}
  						}else if(sleft(ls_return_ftm,5) == '+$$80' && li_len == 20){
  							Idt_return_yxq = '20'+ls_return_ftm.substring(7,9)+'-'+ls_return_ftm.substring(9,11)+'-'+ls_return_ftm.substring(11,13);
  							ls_return_ph = sleft(sright(ls_return_ftm,li_len-13),(sright(ls_return_ftm,li_len-13)).length-2);
  						}else{
  							if(ls_return_ftm.substring(4,6)!='00'){
  								Idt_return_yxq = '20'+ls_return_ftm.substring(8,10)+'-'+ls_return_ftm.substring(6,8)+'-'+ls_return_ftm.substring(4,6);
  							}else{
  								Idt_return_yxq = '20'+ls_return_ftm.substring(8,10)+'-'+ls_return_ftm.substring(6,8)+'-'+'28';
  							}
  							ls_return_ph = sleft(sright(ls_return_ftm,li_len-10),(sright(ls_return_ftm,li_len-10)).length-2);
  						}
  					}else{
  						if(sleft(ls_return_ftm,4) != '+$$2' ){
  							if(ls_return_ftm.substring(3,5)!='02'){
  								Idt_return_yxq = '20'+ls_return_ftm.substring(5,7)+'-'+ls_return_ftm.substring(3,5)+'-'+'30';
  							}else{
  								Idt_return_yxq = '20'+ls_return_ftm.substring(5,7)+'-'+ls_return_ftm.substring(3,5)+'-'+'28';
  							}
  							ls_return_ph = sleft(sright(ls_return_ftm,li_len-7),(sright(ls_return_ftm,li_len-7)).length-2);
  						}else{
  							if(ls_return_ftm.substring(5,7)!='02'){
  								Idt_return_yxq = '20'+ls_return_ftm.substring(3,5)+'-'+ls_return_ftm.substring(5,7)+'-'+'30';
  							}else{
  								Idt_return_yxq = '20'+ls_return_ftm.substring(3,5)+'-'+ls_return_ftm.substring(5,7)+'-'+'28';
  							}
  							if(sleft(ls_return_ftm,4)=='+$$2'){
  								ls_return_ph = sleft(sright(ls_return_ftm,li_len-7),(sright(ls_return_ftm,li_len-7)).length); //开平解析	+$$2106U270763127682E
  							}else{
  								ls_return_ph = sleft(sright(ls_return_ftm,li_len-7),(sright(ls_return_ftm,li_len-7)).length-2);
  							}
  						}
  					}
  				}else{
  					Idt_return_yxq = getDateByDay(parseInt(ls_return_ftm.substring(3,6))-1,'20'+ls_return_ftm.substring(1,3)+'-'+'01-01');
  					ls_return_ph = sleft(sright(ls_return_ftm,li_len-6),(sright(ls_return_ftm,li_len-6)).length-2);
  				}
  			}





  			else if( sleft(ls_return_ftm,2) =='10'){
  				Is_ph = ls_return_ftm;
  				if( Is_ph.length > 12 && Is_ph.length<=18){
  					if(sright(sleft(Is_ph,Is_ph.length-3),2) == '91' || sright(sleft(Is_ph,Is_ph.length-3),2) == '21'){
  						ls_return_ph = sright(sleft(Is_ph,Is_ph.length-5),sleft(Is_ph,Is_ph.length-5).length-2)+'-'+Is_ph.substring(sleft(Is_ph,Is_ph.length-3).length);
  						Idt_return_yxq = '2030-01-01';
  					}else if(sright(sleft(Is_ph,Is_ph.length-4),2) == '91' || sright(sleft(Is_ph,Is_ph.length-4),2) == '21'){
  							ls_return_ph = sright(sleft(Is_ph,Is_ph.length-6),sleft(Is_ph,Is_ph.length-6).length-2)+'-'+Is_ph.substring(sleft(Is_ph,Is_ph.length-4).length);
  							Idt_return_yxq = '2030-01-01';
  					}
  					else if(Is_ph.length == 27){
  						Idt_return_yxq = '20'+ls_return_ftm.substring(10,12)+'-'+ls_return_ftm.substring(12,14)+'-'+ls_return_ftm.substring(14,16);
  						ls_return_ph = Is_ph.substring(3,6);
  					}else if(Is_ph.length == 28){
  						Idt_return_yxq = '20'+ls_return_ftm.substring(12,14)+'-'+ls_return_ftm.substring(14,16)+'-'+ls_return_ftm.substring(16,18);
  						ls_return_ph = Is_ph.substring(3,8);
  					}
  					else if(Is_ph.length == 32){
  						Idt_return_yxq = '20'+(sleft(sright(ls_return_ftm,20),6).substring(0,2)+'-'+(sleft(sright(ls_return_ftm,20),6).substring(2,4)+'-'+sright(sleft(sright(ls_return_ftm,20),6),2)));
  						ls_return_ph = sright(sleft(Is_ph,10),8);
  					}
  					else if(sleft(sright(ls_return_ftm,8),2) == '17'){
  						ls_return_ph = sleft(ls_return_ftm,li_len -8).substring(2,li_len -8);
  						if( sright(ls_return_ftm,2) != '00'){
  							Idt_return_yxq = '20'+sright(ls_return_ftm,6).substring(0,2)+'-'+sright(ls_return_ftm,6).substring(2,4)+'-'+sright(ls_return_ftm,6).substring(4,6);
  						}else{
  							if( sright(ls_return_ftm,6).substring(2,4) == '02'){
  								Idt_return_yxq = '20'+sright(ls_return_ftm,6).substring(0,2)+'-'+sright(ls_return_ftm,6).substring(2,4)+'-28';
  							}else{
  								Idt_return_yxq = '20'+sright(ls_return_ftm,6).substring(0,2)+'-'+sright(ls_return_ftm,6).substring(2,4)+'-30';
  							}
  						}
  					}else{
  						ls_return_ph = sright(Is_ph,(Is_ph).length-2);
  						Idt_return_yxq = '2030-01-01';
  					}
  				}else if(Is_ph.length > 18&&Is_ph.length<=25){//(10)32300102(17)251207(21)00984 21后面为SN序列号
  						//去除序列号位数
  						if(sleft(sright(ls_return_ftm,7),2)=='21'){
  							ls_return_ftm=ls_return_ftm.substring(0,li_len-7);
  							ls_return_ph = ls_return_ftm.substring(2,ls_return_ftm.length -8);
  						}else if(sleft(sright(ls_return_ftm,6),2)=='21'){
  							ls_return_ftm=ls_return_ftm.substring(0,li_len-6);
  							ls_return_ph = ls_return_ftm.substring(2,ls_return_ftm.length -8);
  						}else if(sleft(sright(ls_return_ftm,13),2)=='21'){
  							ls_return_ftm=ls_return_ftm.substring(0,li_len-13);
  							ls_return_ph = ls_return_ftm.substring(2);
  						}

  						if(sleft(sright(ls_return_ftm,8),2)=='17'){
  							Idt_return_yxq = '20'+sright(ls_return_ftm,6).substring(0,2)+'-'+sright(ls_return_ftm,6).substring(2,4)+'-'+sright(ls_return_ftm,6).substring(4,6);
  						}
  				}else if(Is_ph.length > 25){//(10)230318(11)230318(17)250317(21)0618第一种
  						//去除序列号位数
  						if(sleft(sright(ls_return_ftm,7),2)=='21'){
  							ls_return_ftm=ls_return_ftm.substring(0,li_len-7);
  						}else if(sleft(sright(ls_return_ftm,6),2)=='21'){
  							ls_return_ftm=ls_return_ftm.substring(0,li_len-6);
  						}else if(sleft(sright(ls_return_ftm,12),2)=='21'){
  							//(10)212240521(17)260307(21)5025120424第二种
  							ls_return_ftm=ls_return_ftm.substring(0,li_len-12);
  						}
  						if(ls_return_ftm.length<24){//第二种(10)212240521(17)260307
  							if(sleft(sright(Is_ph,12),2)=='21'){
  								ls_return_ph = ls_return_ftm.substring(2,ls_return_ftm.length -8)+'-'+sright(Is_ph,12).substring(2);
  							}else{
  								ls_return_ph = ls_return_ftm.substring(2,ls_return_ftm.length -8);
  							}
  							ls_return_ftm=sright(ls_return_ftm,8);//(17)260307第二种
  							if(sleft(sright(ls_return_ftm,8),2)=='17'){
  								Idt_return_yxq = '20'+sright(ls_return_ftm,6).substring(0,2)+'-'+sright(ls_return_ftm,6).substring(2,4)+'-'+sright(ls_return_ftm,6).substring(4,6);
  							}
  						}else{//(10)230318(11)230318(17)250317=24位第一种
  							ls_return_ph = ls_return_ftm.substring(2,ls_return_ftm.length -16);
  							ls_return_ftm=sright(ls_return_ftm,16);//(11)230318(17)250317第一种
  							if(sleft(sright(ls_return_ftm,8),2)=='17'){
  								Idt_return_yxq = '20'+sright(ls_return_ftm,6).substring(0,2)+'-'+sright(ls_return_ftm,6).substring(2,4)+'-'+sright(ls_return_ftm,6).substring(4,6);
  							}
  							if(sleft(sleft(ls_return_ftm,8),2)=='11'){
  								_ftm.scrq = '20'+sleft(ls_return_ftm,8).substring(2,4)+'-'+sleft(ls_return_ftm,8).substring(4,6)+'-'+sleft(ls_return_ftm,8).substring(6,8);
  							}
  						}
  				}else{
  					ls_return_ph = sright(Is_ph,(Is_ph).length-2);
  					Idt_return_yxq = '2030-01-01';
  				}
  			}else if( sleft(ls_return_ftm,2) == '21'){
  				Idt_return_yxq = '2030-01-01';
  				ls_return_ph = sright(ls_return_ftm,(ls_return_ftm).length-2);
  			}else{
  				ls_return_ph = ''
  				Idt_return_yxq = '2030-01-01';
  			}
  				_ftm.ph=ls_return_ph;
  				_ftm.yxq=Idt_return_yxq;
  				_ftm.ftm=as_tmh;
  				return _ftm;

       }

//解析主条码
export function jxTm(as_tmh){
       			var _ztm={};
       			var _ftm={};
       			var Is_ztm,ls_return_ztm,ls_ftm,ls_return_ftm,Idt_return_yxq,ls_return_ph;
       			as_tmh=as_tmh.replace(/[(|)|（|）/]/g, "");
       			var li_len = as_tmh.length;
       			if(li_len>24 &&("10"===(sleft(as_tmh,2)) ||"00"===(sleft(as_tmh,2)) || "01"===(sleft(as_tmh,2)) || "02"===(sleft(as_tmh,2)))){
       			   if(li_len==40||li_len==41){
       					if("17"===(as_tmh.substring(17,19))){
       						Is_ztm=sleft(as_tmh,17); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm=sright(as_tmh,li_len -17); //得到辅条码
       					}else{
       						Is_ztm=sleft(as_tmh,16); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm=sright(as_tmh,li_len -16); //得到辅条码
       					}
       			   }else if(li_len==43||li_len==44){
       					Is_ztm=sleft(as_tmh,20); //得到主条码
       					ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       					ls_ftm=sright(as_tmh,li_len -20); //得到辅条码
       					if(sleft(as_tmh,2) == '00'){
       						Is_ztm = sleft(as_tmh,20); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len - 20); //得到辅条码
       					}else if(sleft(as_tmh,2) == '01'){
       						Is_ztm = sleft(as_tmh,16); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -16); //得到辅条码
       					}

       				}else if(li_len==47){
       				   if(sright(sleft(as_tmh,18),2)=='11'){
       						Is_ztm = sleft(as_tmh,16); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -16) //得到辅条码
       					}else{
       						Is_ztm = sleft(as_tmh,15) //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -15)
       				    }
       				}else if(li_len == 37){
       					//第17和18是17则前16位是主条码
       					if(sright(sleft(as_tmh,18),2)=='17'){
       						Is_ztm = sleft(as_tmh,16); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -16) //得到辅条码
       					}else{
       						Is_ztm = sleft(as_tmh,15); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -15) //得到辅条码
       					}
       				}else if(li_len == 46 || li_len == 45 || li_len == 48){
       					if(sright(sleft(as_tmh,18),2)=='17'){
       						Is_ztm = sleft(as_tmh,16); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -16) //得到辅条码
       					}else if(sright(sleft(as_tmh,18),2)=='11'){
       						Is_ztm = sleft(as_tmh,16); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -16) //得到辅条码
       					}else if(sright(sleft(as_tmh,18),2)=='10'){
       						Is_ztm = sleft(as_tmh,16); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -16) //得到辅条码
       					}else{
       						Is_ztm = sleft(as_tmh,15); //得到主条码
       						ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       						ls_ftm = sright(as_tmh,li_len -15) //得到辅条码
       				      }
       				}else if(li_len==32){
       					Is_ztm = sleft(as_tmh,16);//得到主条码
       					ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       					ls_ftm = sright(as_tmh,li_len -16); //得到辅条码
       				}else if(li_len==25&&as_tmh.indexOf('-')>-1){
       					Is_ztm = as_tmh;
       					ls_return_ztm = ''+sleft(as_tmh,2)+''+sright(as_tmh,as_tmh.length-2);
       				}else if(li_len==28){
       					Is_ztm = as_tmh;
       					ls_return_ztm = ''+sleft(as_tmh,2)+''+sright(as_tmh,as_tmh.length-2);
       				}
       				else{
       					Is_ztm=sleft(as_tmh,16); //得到主条码
       					ls_return_ztm = ''+sleft(Is_ztm,2)+''+sright(Is_ztm,Is_ztm.length-2);
       					ls_ftm=sright(as_tmh,li_len -16); //得到辅条码
       				}

       				ls_return_ftm=ls_ftm;

       				_ftm=jxFtm(ls_return_ftm);

       				_ztm.ztm=ls_return_ztm;
       				_ztm.ftm=_ftm.ftm;
       				_ztm.yxq=_ftm.yxq;
       				_ztm.ph=_ftm.ph;
       				_ztm.scrq=_ftm.scrq;
       			}else if(li_len>24 && "+"===(sleft(as_tmh,1))){

       				ls_return_ztm=sleft(as_tmh,as_tmh.indexOf('/')-1);
       				ls_return_ftm=sright(as_tmh,as_tmh.length-as_tmh.indexOf('/'));

       				var day=Integer.valueOf(ls_return_ftm.substring(2,5))-1;
       				Idt_return_yxq = getDateByDay(day,"20"+sleft(ls_return_ftm,2)+"-01-01");
       				ls_return_ph=sleft(sright(ls_return_ftm,li_len-5),(sright(ls_return_ftm,li_len-5)).length-4);

       				_ztm.ztm=ls_return_ztm;
       				_ztm.ftm=ls_return_ftm;
       				_ztm.yxq=Idt_return_yxq;
       				_ztm.ph=ls_return_ph;

       				_ztm.scrq=getDateByDay(-180);
       			}
       			else{
       				Is_ztm=as_tmh;
       				ls_return_ztm = ''+sleft(as_tmh,2)+''+sright(as_tmh,as_tmh.length-2);
       				_ztm.ztm=ls_return_ztm;
       			}
       			return _ztm;
       	}

